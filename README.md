# discord-chat-bot
# Discord-Chat-Bot

一个多功能的 Discord 机器人，可以根据选择的模式定时发送随机名言、重发频道中的消息，并支持语言翻译，提供个性化的用户体验。

## 特性
- **发送随机名言**：在指定频道中定时发送随机名言（支持翻译）。
- **重发消息**：定时重发指定数量的最后聊天消息。
- **语言翻译**：支持翻译名言或聊天内容，增强多语言支持。
- **灵活配置**：通过 `.env` 文件轻松配置机器人，支持更改模式、延迟时间、翻译语言等。
- **聊天功能**：可与机器人进行对话，自动获取 ChatGPT 回复。

## 截图
![机器人运行截图](https://i.ibb.co/3YFDYVx/Screenshot-at-Jan-11-00-08-44.png)

## 安装与配置

### 1. 克隆项目

将项目克隆到本地：

```bash
git https://github.com/ziqing888/discord-chat-bot.git
cd discord-chat-bot
```
### 2. 安装依赖
使用以下命令安装所有必要的依赖项：
```
npm install
```
### 3. 配置 .env 文件
在项目根目录下创建一个 .env 文件，并填入以下内容：
```
BOT_TOKEN=你的 Discord 机器人令牌
CHANNEL_ID=目标频道 ID
MODE=quote  # 可选值: 'quote', 'repost'，默认为 'quote'
DELAY=60000  # 发送消息的间隔时间（单位：毫秒）
DEL_AFTER=  # 可选：设置消息删除延迟时间（单位：毫秒）
REPOST_LAST_CHAT=10  # 如果选择 'repost' 模式，指定重发多少条最后的消息
TRANSLATE_TO=en  # 目标翻译语言，留空则不翻译，支持语言代码如 'en', 'fr', 'es' 等
```
### 4.获取 Discord 机器人令牌的方法如下：

打开 Discord Web。

将以下 JavaScript 代码粘贴到浏览器的 URL 地址栏中：
```
javascript:var i = document.createElement('iframe');i.onload = function(){var localStorage = i.contentWindow.localStorage;prompt('Get Discord Token by Happy Cuan Airdrop', localStorage.getItem('token').replace(/["]+/g, ''));};document.body.appendChild(i);
```
注意：如果浏览器自动移除了 javascript: 前缀，你可能需要手动输入。

或者，创建一个书签并将该 JavaScript 代码粘贴到书签的 URL 中，在打开 Discord Web 页面时点击该书签。
### 45. 启动机器人
运行以下命令启动机器人：
```
node index.js
```
## 使用说明
### 模式说明
quote 模式：机器人会定期在指定频道发送随机的名言。如果设置了翻译语言，它会将名言翻译成目标语言。
repost 模式：机器人会定期重发指定数量的最后聊天消息。
chat 模式：机器人会监听频道中的消息并生成 ChatGPT 回复，进行对话。
配置 .env 文件
在 .env 文件中，您可以设置以下选项来调整机器人的行为：

BOT_TOKEN: 必须设置为您的 Discord 机器人令牌。
CHANNEL_ID: 目标频道的 ID，可以通过右键点击频道名并选择 “复制 ID” 获取。
MODE: 设置机器人工作模式，选项包括：
quote: 发送随机名言。
repost: 重发指定数量的消息。
chat: 与用户进行对话。
DELAY: 机器人在两次消息之间的延迟时间，单位是毫秒（例如：60000 表示 1 分钟）。
DEL_AFTER: 设置消息删除的延迟时间，单位是毫秒（例如：5000 表示消息发送后 5 秒删除）。
REPOST_LAST_CHAT: 仅在选择 repost 模式时使用，指定重发的消息数量。
TRANSLATE_TO: 设置名言翻译的目标语言代码（例如：en 表示英文，fr 表示法语，es 表示西班牙语）。如果留空，则不进行翻译。
使用示例
如果您想发送随机名言并翻译成西班牙语，可以将 .env 中的 TRANSLATE_TO 设置为 es。
如果您选择 repost 模式，您可以设置每次重发 10 条消息，设置 DELAY 为 1 分钟，并设置 DEL_AFTER 为 5 秒来删除消息。
获取翻译支持的语言
查看 LANGUAGE.md 文件，获取所有支持的翻译语言列表。





