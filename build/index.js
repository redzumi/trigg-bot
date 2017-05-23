'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _nodeTelegramBotApi = require('node-telegram-bot-api');

var _nodeTelegramBotApi2 = _interopRequireDefault(_nodeTelegramBotApi);

var _fs = require('mz/fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// cuz fuck it
var readJSON = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(file) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.t0 = JSON;
            _context.next = 3;
            return _fs2.default.readFile(file);

          case 3:
            _context.t1 = _context.sent;
            return _context.abrupt('return', _context.t0.parse.call(_context.t0, _context.t1));

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function readJSON(_x) {
    return _ref.apply(this, arguments);
  };
}();
var saveJSON = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(file, data) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', _fs2.default.writeFile(file, (0, _stringify2.default)(data)));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function saveJSON(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

// some functional shits
var isAdmin = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(bot, chatId, user) {
    var chat, admins, adminsIds;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return bot.getChat(chatId);

          case 2:
            chat = _context3.sent;

            if (!(chat.all_members_are_administrators || chat.type === 'private')) {
              _context3.next = 5;
              break;
            }

            return _context3.abrupt('return', true);

          case 5:
            _context3.next = 7;
            return bot.getChatAdministrators(chatId);

          case 7:
            admins = _context3.sent;
            adminsIds = admins.map(function (admin) {
              return admin.user.id;
            });
            return _context3.abrupt('return', adminsIds.includes(user.id));

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function isAdmin(_x4, _x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var TriggBot = function TriggBot() {
  var _this = this;

  (0, _classCallCheck3.default)(this, TriggBot);
  this.start = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return readJSON(TriggBot.FILES.config);

          case 2:
            _this.config = _context4.sent;


            _this.triggers = new Triggers(TriggBot.FILES.triggers);
            _context4.next = 6;
            return _this.triggers.load();

          case 6:

            _this.bot = new _nodeTelegramBotApi2.default(_this.config.token, { polling: true });

            return _context4.abrupt('return', _this.startHandleMessages());

          case 8:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this);
  }));
  this.startHandleMessages = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _this.bot.on('message', function () {
              var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(message) {
                return _regenerator2.default.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        if (message.text) {
                          _context5.next = 2;
                          break;
                        }

                        return _context5.abrupt('return', null);

                      case 2:
                        if (!message.text.startsWith('/')) {
                          _context5.next = 6;
                          break;
                        }

                        TriggBot.COMMANDS.forEach(function (command) {
                          var commandReg = new RegExp('/(' + command.name + ')' + (command.parseArguments ? ' (.+)' : ''));
                          var match = commandReg.exec(message.text);

                          return match ? _this.onCommand(message, match, command) : null;
                        });
                        _context5.next = 8;
                        break;

                      case 6:
                        _context5.next = 8;
                        return _this.onMessage(message);

                      case 8:
                        return _context5.abrupt('return', null);

                      case 9:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, _callee5, _this);
              }));

              return function (_x7) {
                return _ref6.apply(this, arguments);
              };
            }());

          case 1:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this);
  }));

  this.reply = function () {
    var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(chatId, text, options) {
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt('return', _this.bot.sendMessage(chatId, text, options));

            case 1:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this);
    }));

    return function (_x8, _x9, _x10) {
      return _ref7.apply(this, arguments);
    };
  }();

  this.onCommand = function () {
    var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(message, match, command) {
      var chatId, trigger, chatTriggers, triggersListMessage;
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              chatId = message.chat.id;
              _context8.t0 = command.onlyAdmin;

              if (!_context8.t0) {
                _context8.next = 6;
                break;
              }

              _context8.next = 5;
              return isAdmin(_this.bot, chatId, message.from);

            case 5:
              _context8.t0 = !_context8.sent;

            case 6:
              if (!_context8.t0) {
                _context8.next = 8;
                break;
              }

              return _context8.abrupt('return', _this.reply(chatId, TriggBot.LOCALE.bot.notAdmin));

            case 8:
              _context8.t1 = command.name;
              _context8.next = _context8.t1 === 'add' ? 11 : _context8.t1 === 'del' ? 19 : _context8.t1 === 'all' ? 30 : 37;
              break;

            case 11:
              if (!_this.triggers.add(chatId, match[2])) {
                _context8.next = 16;
                break;
              }

              _context8.next = 14;
              return _this.reply(chatId, TriggBot.LOCALE.triggers.add.done);

            case 14:
              _context8.next = 18;
              break;

            case 16:
              _context8.next = 18;
              return _this.reply(chatId, TriggBot.LOCALE.triggers.add.help);

            case 18:
              return _context8.abrupt('break', 38);

            case 19:
              trigger = _this.triggers.getByTarget(chatId, match[2]);

              if (!trigger) {
                _context8.next = 27;
                break;
              }

              _context8.next = 23;
              return _this.triggers.remove(chatId, trigger);

            case 23:
              _context8.next = 25;
              return _this.reply(chatId, TriggBot.LOCALE.triggers.del.done);

            case 25:
              _context8.next = 29;
              break;

            case 27:
              _context8.next = 29;
              return _this.reply(chatId, TriggBot.LOCALE.triggers.del.help);

            case 29:
              return _context8.abrupt('break', 38);

            case 30:
              chatTriggers = _this.triggers.getByChatID(chatId);

              if (!(!chatTriggers || chatTriggers.length === 0)) {
                _context8.next = 33;
                break;
              }

              return _context8.abrupt('return', _this.reply(chatId, TriggBot.LOCALE.triggers.all.empty));

            case 33:
              triggersListMessage = chatTriggers.map(function (trigger) {
                return trigger.target + ' - ' + trigger.message;
              });
              _context8.next = 36;
              return _this.reply(chatId, triggersListMessage.join('\n'));

            case 36:
              return _context8.abrupt('break', 38);

            case 37:
              return _context8.abrupt('return', null);

            case 38:
              return _context8.abrupt('return', null);

            case 39:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this);
    }));

    return function (_x11, _x12, _x13) {
      return _ref8.apply(this, arguments);
    };
  }();

  this.onMessage = function () {
    var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(message) {
      var chatId, triggers;
      return _regenerator2.default.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              chatId = message.chat.id;
              triggers = _this.triggers.getTriggersByText(chatId, message.text);


              triggers.forEach(function () {
                var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(trigger) {
                  return _regenerator2.default.wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          _context9.next = 2;
                          return _this.reply(chatId, trigger.message, {
                            reply_to_message_id: message.message_id
                          });

                        case 2:
                        case 'end':
                          return _context9.stop();
                      }
                    }
                  }, _callee9, _this);
                }));

                return function (_x15) {
                  return _ref10.apply(this, arguments);
                };
              }());

            case 3:
            case 'end':
              return _context10.stop();
          }
        }
      }, _callee10, _this);
    }));

    return function (_x14) {
      return _ref9.apply(this, arguments);
    };
  }();
};

TriggBot.FILES = {
  config: '../config.json',
  triggers: '../triggers.json' };
TriggBot.COMMANDS = [{ name: 'add', parseArguments: true, onlyAdmin: true }, { name: 'del', parseArguments: true, onlyAdmin: true }, { name: 'all', parseArguments: false, onlyAdmin: false }];
TriggBot.LOCALE = {
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

var Triggers = function Triggers(file) {
  var _this2 = this;

  (0, _classCallCheck3.default)(this, Triggers);
  this.load = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return readJSON(_this2.file);

          case 2:
            _this2.triggers = _context11.sent;

          case 3:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, _this2);
  }));
  this.save = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12() {
    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            return _context12.abrupt('return', saveJSON(_this2.file, _this2.triggers));

          case 1:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, _this2);
  }));

  this.getTriggersByText = function (chatId, message) {
    return _this2.triggers[chatId].filter(function (trigger) {
      return message.includes(trigger.target);
    });
  };

  this.getByTarget = function (chatId, target) {
    return _this2.triggers[chatId].find(function (trigger) {
      return trigger.target === target;
    });
  };

  this.getByChatID = function (chatId) {
    return _this2.triggers[chatId];
  };

  this.add = function () {
    var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13(chatId, text) {
      var reqRegex, data, trigger;
      return _regenerator2.default.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              reqRegex = new RegExp(/(.+)(\/)(.+)/g);
              data = reqRegex.exec(text);

              if (data) {
                _context13.next = 4;
                break;
              }

              return _context13.abrupt('return', null);

            case 4:
              trigger = { target: data[1].trim(), message: data[3].trim() };


              if (!_this2.triggers[chatId]) {
                _this2.triggers[chatId] = [];
              }

              _this2.triggers[chatId].push(trigger);
              _context13.next = 9;
              return _this2.save();

            case 9:
              return _context13.abrupt('return', trigger);

            case 10:
            case 'end':
              return _context13.stop();
          }
        }
      }, _callee13, _this2);
    }));

    return function (_x16, _x17) {
      return _ref13.apply(this, arguments);
    };
  }();

  this.remove = function () {
    var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee14(chatId, trigger) {
      return _regenerator2.default.wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              _this2.triggers[chatId].splice(_this2.triggers[chatId].indexOf(trigger), 1); // smell?

              return _context14.abrupt('return', _this2.save());

            case 2:
            case 'end':
              return _context14.stop();
          }
        }
      }, _callee14, _this2);
    }));

    return function (_x18, _x19) {
      return _ref14.apply(this, arguments);
    };
  }();

  this.file = file;
  this.triggers = {};
};

new TriggBot().start();