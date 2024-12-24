require('dotenv').config();
const Discord = require('discord-simple-api');
const colors = require('colors');
const fs = require('fs');
const readlineSync = require('readline-sync');
const translate = require('translate-google');

function shouldUsePreviousSettings() {
  const envFileExists = fs.existsSync('.env');

  if (envFileExists) {
    const usePrevious = readlineSync.keyInYNStrict(
      '是否使用上次的设置？'
    );

    if (usePrevious) {
      try {
        const envContent = fs.readFileSync('.env', 'utf8');
        const envLines = envContent.split('\n');
        envLines.forEach((line) => {
          const [key, value] = line.split('=').map((entry) => entry.trim());
          if (key && value) {
            process.env[key] = value;
          }
        });
        return true;
      } catch (error) {
        console.error('读取 .env 文件时出错:', error.message);
      }
    }
  }

  return false;
}

const usePreviousSettings = shouldUsePreviousSettings();

let botToken = process.env.BOT_TOKEN;
let channelId = process.env.CHANNEL_ID;
let mode = process.env.MODE || 'quote';
let delay = process.env.DELAY || 60000;
let delAfter = process.env.DEL_AFTER || '';
let repostLastChat = process.env.REPOST_LAST_CHAT || 10;
let translateTo = process.env.TRANSLATE_TO || 'en';

const quoteEN = require('./quotes-en.json');

if (!usePreviousSettings) {
  botToken = readlineSync.question('请输入你的 Discord 机器人令牌: ', {
    defaultInput: botToken,
  });
  channelId = readlineSync.question('请输入频道 ID: ', {
    defaultInput: channelId,
  });
  mode = readlineSync.question('请输入模式 (quote, repost): ', {
    defaultInput: mode,
  });
  delay = readlineSync.questionInt(
    '请输入延迟时间（毫秒，1000ms = 1秒）: ',
    { defaultInput: delay }
  );
  delAfter = readlineSync.question(
    '请输入删除延迟时间（毫秒，若不需要请留空）: ',
    { defaultInput: delAfter }
  );

  while (!['quote', 'repost'].includes(mode.toLowerCase())) {
    console.log(colors.red('无效的模式！请输入有效模式.'));
    mode = readlineSync.question('请输入模式 (quote, repost): ', {
      defaultInput: mode,
    });
  }

  while (isNaN(delay) || delay <= 0) {
    console.log(colors.red('无效的延迟时间！请输入正数.'));
    delay = readlineSync.questionInt(
      '请输入延迟时间（毫秒，1000ms = 1秒）: ',
      { defaultInput: delay }
    );
  }

  while (delAfter !== '' && (isNaN(delAfter) || delAfter < 0)) {
    console.log(
      colors.red(
        '无效的删除延迟时间！请输入非负数或留空.'
      )
    );
    delAfter = readlineSync.question(
      '请输入删除延迟时间（毫秒，若不需要请留空）: ',
      { defaultInput: delAfter }
    );
  }

  if (mode.toLowerCase() === 'repost') {
    while (isNaN(repostLastChat) || repostLastChat <= 0) {
      console.log(
        colors.red(
          '无效的最后聊天消息数！请输入正数.'
        )
      );
      repostLastChat = readlineSync.questionInt(
        '请输入要重发的最后聊天消息数: ',
        { defaultInput: repostLastChat }
      );
    }
  }

  translateTo = readlineSync.question(
    '请输入翻译语言代码（参考 LANGUAGE.md）或留空以使用英语（en）: ',
    {
      defaultInput: translateTo,
    }
  );

  const envData = `BOT_TOKEN=${botToken}\nCHANNEL_ID=${channelId}\nMODE=${mode}\nDELAY=${delay}\nDEL_AFTER=${delAfter}\nREPOST_LAST_CHAT=${repostLastChat}\nTRANSLATE_TO=${translateTo}`;
  fs.writeFileSync('.env', envData);
}

let bot;

try {
  bot = new Discord(botToken);
} catch (error) {
  console.error(colors.red('初始化 Discord 机器人时出错:'), error.message);
  process.exit(1);
}

async function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quoteEN.length);
  const textToTranslate = quoteEN[randomIndex].text;

  let translatedText = textToTranslate;

  if (translateTo && translateTo.toLowerCase() !== 'en') {
    try {
      translatedText = await translate(textToTranslate, { to: translateTo });
    } catch (error) {
      console.error(colors.red('翻译时出错:'), error.message);
    }
  }

  return translatedText;
}

bot
  .getUserInformation()
  .then((userInfo) => {
    const me = userInfo.username + '#' + userInfo.discriminator;
    console.log(colors.green('登录成功，用户名: %s'), me);
  })
  .catch((error) => {
    console.error(colors.red('获取用户信息时出错:'), error.message);
  });
console.log(colors.yellow('当前模式: %s'), mode);

function processMessage(_, contentCallback) {
  bot.getMessagesInChannel(channelId, 1).then((messageData) => {
    const hasMessages = messageData && messageData.length > 0;

    if (!hasMessages) {
      console.warn(
        colors.yellow('频道没有消息，仍然发送一条消息.')
      );
    }

    contentCallback(hasMessages ? messageData.reverse()[0].content : '').then(
      (response) => {
        bot.sendMessageToChannel(channelId, response).then((sentMessage) => {
          const sentMessageContent = sentMessage.content;
          console.log(
            colors.green('[发送][%s] %s'),
            sentMessage.id,
            sentMessageContent
          );

          if (delAfter) {
            setTimeout(() => {
              bot
                .deleteMessageInChannel(channelId, sentMessage.id)
                .then((deletedMessage) => {
                  if (deletedMessage) {
                    console.log(
                      colors.red('[删除][%s] %s'),
                      deletedMessage.id,
                      sentMessageContent
                    );
                  } else {
                    console.log(
                      colors.red('[删除][%s] 删除成功'),
                      sentMessage.id
                    );
                  }
                })
                .catch((error) => {
                  console.error(colors.red('[删除] 错误:'), error.message);
                });
            }, delAfter);
          }
        });
      }
    );
  });
}

setInterval(() => processMessage(null, getRandomQuote), delay);
