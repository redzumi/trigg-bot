import TelegramBot from 'node-telegram-bot-api';
import fs from 'mz/fs';

// cuz fuck it
const readJSON = async file => JSON.parse(await fs.readFile(file));
const saveJSON = async (file, data) => fs.writeFile(file, JSON.stringify(data));

// some functional shits
const isAdmin = async (bot, chatId, user) => {
  const chat = await bot.getChat(chatId);

  if (chat.all_members_are_administrators || chat.type === 'private') {
    return true;
  }

  const admins = await bot.getChatAdministrators(chatId);
  const adminsIds = admins.map(admin => admin.user.id);

  return adminsIds.includes(user.id);
};

class TriggBot {

  static FILES = {
    config: '../config.json',
    triggers: '../triggers.json' };

  static COMMANDS = [
    { name: 'add', parseArguments: true, onlyAdmin: true },
    { name: 'addj', parseArguments: true, onlyAdmin: true },
    { name: 'del', parseArguments: true, onlyAdmin: true },
    { name: 'all', parseArguments: false, onlyAdmin: false } ];

  static LOCALE = {
    bot: {
      notAdmin: 'У вас нет на это прав.',
      tagsNotAllowed: 'Теги через /add запрещены. Используй /addj.',
      invalidJson: 'Invalid json.',
      invalidArgs: 'Use: /addj { "target": "foo", "message": "bar" }'
    },
    triggers: {
      add: {
        done: 'Добавил.',
        help: 'Используй /add <слово> / <сообщение>',
        len: 'Минимальная длинна - 4 символа.'
      },
      del: {
        done: 'Удалил.',
        help: 'Используй /del <слово>'
      },
      all: {
        empty: 'Тут пока ничего нет.'
      }
    } };

  start = async () => {
    this.config = await readJSON(TriggBot.FILES.config);

    this.triggers = new Triggers(TriggBot.FILES.triggers);
    await this.triggers.load();

    this.bot = new TelegramBot(this.config.token, { polling: true });

    // STARTED LOGS
    const currentTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    console.log(`started at ${currentTime}`);

    return this.startHandleMessages();
  };

  startHandleMessages = async () => {
    this.bot.on('message', async (message) => {
      if (!message.text) {
        return null;
      }

      if (message.text.startsWith('/')) {
        TriggBot.COMMANDS.forEach((command) => {
          const commandReg = new RegExp(`/(${command.name})${(command.parseArguments ? ' (.+)' : '')}`);
          const match = commandReg.exec(message.text);

          return (match) ? this.onCommand(message, match, command) : null;
        });
      } else {
        await this.onMessage(message);
      }

      return null;
    });
  };

  reply = async (chatId, text, options) => this.bot.sendMessage(chatId, text, options);

  onCommand = async (message, match, command) => {
    const chatId = message.chat.id;

    if (command.onlyAdmin && !await isAdmin(this.bot, chatId, message.from)) {
      return this.reply(chatId, TriggBot.LOCALE.bot.notAdmin);
    }

    switch (command.name) {
      case 'add' : {
        if (match[2].length < 4) {
          await this.reply(chatId, TriggBot.LOCALE.triggers.add.len);
          break;
        }

        // tags only for /addj
        // TODO better checking?
        if (match[2].includes('<') && match[2].includes('</')) {
          await this.reply(chatId, TriggBot.LOCALE.bot.tagsNotAllowed);
          break;
        }

        if (this.triggers.parseAndAdd(chatId, match[2])) {
          await this.reply(chatId, TriggBot.LOCALE.triggers.add.done);
        } else {
          await this.reply(chatId, TriggBot.LOCALE.triggers.add.help);
        }

        break;
      }

      case 'addj' : {
        // SMELL CODE
        const rawJson = message.text.replace('/addj', '');

        try {
          const jsonData = JSON.parse(rawJson);

          if (!jsonData.target || !jsonData.message) {
            await this.reply(chatId, TriggBot.LOCALE.bot.invalidArgs);
            break;
          }

          if (this.triggers.add(chatId, jsonData)) {
            await this.reply(chatId, TriggBot.LOCALE.triggers.add.done);
          } else {
            await this.reply(chatId, TriggBot.LOCALE.triggers.add.help);
          }
        } catch (ex) {
          await this.reply(chatId, TriggBot.LOCALE.bot.invalidJson);
          break;
        }
        break;
      }

      case 'del' : {
        const trigger = this.triggers.getByTarget(chatId, match[2]);

        if (trigger) {
          await this.triggers.remove(chatId, trigger);
          await this.reply(chatId, TriggBot.LOCALE.triggers.del.done);
        } else {
          await this.reply(chatId, TriggBot.LOCALE.triggers.del.help);
        }

        break;
      }

      case 'all' : {
        const chatTriggers = this.triggers.getByChatID(chatId);

        if (!chatTriggers || chatTriggers.length === 0) {
          return this.reply(chatId, TriggBot.LOCALE.triggers.all.empty);
        }

        const triggersListMessage = chatTriggers.map(
          trigger => `${trigger.target} - ${trigger.message}`
        );

        await this.reply(chatId, triggersListMessage.join('\n'));

        break;
      }

      default: {
        return null;
      }
    }

    return null;
  };

  onMessage = async (message) => {
    const chatId = message.chat.id;
    const triggers = this.triggers.getTriggersByText(chatId, message.text);

    triggers.forEach(async (trigger) => {
      await this.reply(chatId, trigger.message, {
        reply_to_message_id: message.message_id,
        parse_mode: 'html'
      });
    });
  };
}

class Triggers {
  constructor(file) {
    this.file = file;
    this.triggers = {};
  }

  load = async () => {
    this.triggers = await readJSON(this.file);
  };

  save = async () => saveJSON(this.file, this.triggers);

  getTriggersByText = (chatId, message) => {
    if (!this.triggers[chatId]) {
      return [];
    }

    // LOWER CASE
    return this.triggers[chatId].filter(trigger => message.toLowerCase().includes(trigger.target.toLowerCase()));
  };

  getByTarget = (chatId, target) =>
    this.triggers[chatId].find(trigger => trigger.target === target);

  getByChatID = chatId => this.triggers[chatId];

  parseAndAdd = async (chatId, text) => {
    const reqRegex = new RegExp(/(.+)(\/)(.+)/g);
    const data = reqRegex.exec(text);

    if (!data) {
      return null;
    }

    const trigger = { target: data[1].trim(), message: data[3].trim() };

    if (!this.triggers[chatId]) {
      this.triggers[chatId] = [];
    }

    await this.add(chatId, trigger);

    return trigger;
  };

  add = async (chatId, trigger) => {
    this.triggers[chatId].push(trigger);
    await this.save();

    return trigger;
  };

  remove = async (chatId, trigger) => {
    this.triggers[chatId].splice(this.triggers[chatId].indexOf(trigger), 1); // smell?

    return this.save();
  };
}

new TriggBot().start();
