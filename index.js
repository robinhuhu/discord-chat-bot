require('dotenv').config();
const Discord = require('discord-simple-api');
const colors = require('colors');
const fs = require('fs');
const readlineSync = require('readline-sync');
const translate = require('translate-google');

function logEvent(type, messageId, content = '') {
  
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  const separator = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'; 

  switch (type) {
    case 'send':
      console.log(
        `${colors.green('✅ [发送]')} ${colors.yellow(`[时间: ${timestamp}]`)}\n` +
        `${colors.cyan('🆔 消息 ID:')} ${colors.cyan(messageId)}\n` +
        `${colors.white('📄 内容:')} ${colors.white(content)}`
      );
      console.log(separator);
      break;

    case 'delete':
      console.log(
        `${colors.red('🗑️ [删除]')} ${colors.yellow(`[时间: ${timestamp}]`)}\n` +
        `${colors.cyan('🆔 消息 ID:')} ${colors.cyan(messageId)}\n` +
        `${colors.white('📄 状态: 删除成功')}`
      );
      console.log(separator);
      break;

    case 'mode':
      console.log(
        `${colors.yellow('🚀 [当前模式]')} ${colors.green(`[${content}]`)}`
      );
      console.log(separator);
      break;

    case 'error':
      console.log(
        `${colors.red('❌ [错误]')} ${colors.yellow(`[时间: ${timestamp}]`)}\n` +
        `${colors.white(content)}`
      );
      console.log(separator);
      break;

    default:
      console.log(
        `${colors.gray('[未知事件]')} ${colors.yellow(`[时间: ${timestamp}]`)}\n` +
        `${colors.white(content)}`
      );
      console.log(separator);
      break;
  }
}


function shouldUsePreviousSettings() {
  const envFileExists = fs.existsSync('.env');

  if (envFileExists) {
    const usePrevious = readlineSync.keyInYNStrict('是否使用上次的设置？');
    if (usePrevious) {
      try {
        const envContent = fs.readFileSync('.env', 'utf8');
        envContent.split('\n').forEach((line) => {
          const [key, value] = line.split('=').map((entry) => entry.trim());
          if (key && value) {
            process.env[key] = value;
          }
        });
        return true;
      } catch (error) {
        logEvent('error', '', `读取 .env 文件时出错: ${error.message}`);
      }
    }
  }
  return false;
}

const usePreviousSettings = shouldUsePreviousSettings();


let botToken = process.env.BOT_TOKEN;
let channelId = process.env.CHANNEL_ID;
let mode = process.env.MODE || 'quote';
let delay = parseInt(process.env.DELAY) || 60000;
let delAfter = parseInt(process.env.DEL_AFTER) || '';
let repostLastChat = parseInt(process.env.REPOST_LAST_CHAT) || 10;
let translateTo = process.env.TRANSLATE_TO || 'en';

const quoteEN = require('./quotes-en.json');


if (!usePreviousSettings) {
  botToken = readlineSync.question('请输入你的 Discord 机器人令牌: ', { defaultInput: botToken });
  channelId = readlineSync.question('请输入频道 ID: ', { defaultInput: channelId });
  mode = readlineSync.question('请输入模式 (quote, repost): ', { defaultInput: mode });
  delay = readlineSync.questionInt('请输入延迟时间（毫秒，1000ms = 1秒）: ', { defaultInput: delay });
  delAfter = readlineSync.question('请输入删除延迟时间（毫秒，若不需要请留空）: ', { defaultInput: delAfter });

  while (!['quote', 'repost'].includes(mode.toLowerCase())) {
    console.log(colors.red('无效的模式！请输入有效模式.'));
    mode = readlineSync.question('请输入模式 (quote, repost): ', { defaultInput: mode });
  }

  while (isNaN(delay) || delay <= 0) {
    console.log(colors.red('无效的延迟时间！请输入正数.'));
    delay = readlineSync.questionInt('请输入延迟时间（毫秒，1000ms = 1秒）: ', { defaultInput: delay });
  }

  while (delAfter !== '' && (isNaN(delAfter) || delAfter < 0)) {
    console.log(colors.red('无效的删除延迟时间！请输入非负数或留空.'));
    delAfter = readlineSync.question('请输入删除延迟时间（毫秒，若不需要请留空）: ', { defaultInput: delAfter });
  }

  if (mode.toLowerCase() === 'repost') {
    while (isNaN(repostLastChat) || repostLastChat <= 0) {
      console.log(colors.red('无效的最后聊天消息数！请输入正数.'));
      repostLastChat = readlineSync.questionInt('请输入要重发的最后聊天消息数: ', { defaultInput: repostLastChat });
    }
  }

  translateTo = readlineSync.question('请输入翻译语言代码（参考 LANGUAGE.md）或留空以使用英语（en）: ', { defaultInput: translateTo });

  const envData = `BOT_TOKEN=${botToken}\nCHANNEL_ID=${channelId}\nMODE=${mode}\nDELAY=${delay}\nDEL_AFTER=${delAfter}\nREPOST_LAST_CHAT=${repostLastChat}\nTRANSLATE_TO=${translateTo}`;
  fs.writeFileSync('.env', envData);
}

let bot;

try {
  bot = new Discord(botToken);
} catch (error) {
  logEvent('error', '', `初始化 Discord 机器人时出错: ${error.message}`);
  process.exit(1);
}

async function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quoteEN.length);
  const textToTranslate = quoteEN[randomIndex].text;

  if (translateTo && translateTo.toLowerCase() !== 'en') {
    try {
      return await translate(textToTranslate, { to: translateTo });
    } catch (error) {
      logEvent('error', '', `翻译时出错: ${error.message}`);
      return textToTranslate;
    }
  }
  return textToTranslate;
}


function processMessage(_, contentCallback) {
  bot.getMessagesInChannel(channelId, 1).then((messageData) => {
    const hasMessages = messageData && messageData.length > 0;

    contentCallback(hasMessages ? messageData.reverse()[0].content : '').then((response) => {
      bot.sendMessageToChannel(channelId, response).then((sentMessage) => {
        logEvent('send', sentMessage.id, response);

        if (delAfter) {
          setTimeout(() => {
            bot.deleteMessageInChannel(channelId, sentMessage.id).then(() => {
              logEvent('delete', sentMessage.id);
            }).catch((error) => {
              logEvent('error', sentMessage.id, `删除消息时出错: ${error.message}`);
            });
          }, delAfter);
        }
      }).catch((error) => {
        logEvent('error', '', `发送消息时出错: ${error.message}`);
      });
    });
  });
}


logEvent('mode', '', mode);
setInterval(() => processMessage(null, getRandomQuote), delay);
