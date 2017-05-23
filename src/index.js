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
    { name: 'del', parseArguments: true, onlyAdmin: true },
    { name: 'all', parseArguments: false, onlyAdmin: false } ];

  static LOCALE = {
    bot: {
      notAdmin: 'У вас нет на это прав.'
    },
    triggers: {
      add: {
        done: 'Добавил.',
        help: 'Используй /add <слово> / <сообщение>'
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
        if (this.triggers.add(chatId, match[2])) {
          await this.reply(chatId, TriggBot.LOCALE.triggers.add.done);
        } else {
          await this.reply(chatId, TriggBot.LOCALE.triggers.add.help);
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
        reply_to_message_id: message.message_id
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

  getTriggersByText = (chatId, message) =>
    this.triggers[chatId].filter(trigger => message.includes(trigger.target));

  getByTarget = (chatId, target) =>
    this.triggers[chatId].find(trigger => trigger.target === target);

  getByChatID = chatId => this.triggers[chatId];

  add = async (chatId, text) => {
    const reqRegex = new RegExp(/(.+)(\/)(.+)/g);
    const data = reqRegex.exec(text);

    if (!data) {
      return null;
    }

    const trigger = { target: data[1].trim(), message: data[3].trim() };

    if (!this.triggers[chatId]) {
      this.triggers[chatId] = [];
    }

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
