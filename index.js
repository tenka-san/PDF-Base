// base by 7eppeli.pdf
console.clear();
const { 
    default: makeWASocket, 
    prepareWAMessageMedia, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    generateWAMessageFromContent, 
    generateWAMessageContent, 
    jidDecode, 
    proto, 
    baileys,
    downloadContentFromMessage, 
    fetchLatestWaWebVersion,
    generateMessageID,
    Browsers,
    MessageRetryMap 
} = require("@whiskeysockets/baileys");
const axios = require('axios');
const pino = require('pino');
const readline = require("readline");
const fs = require('fs');
const figlet = require('figlet');
const chalk = require("chalk");
const crypto = require('crypto');
const { Boom } = require('@hapi/boom');
const {
  smsg,
  sendGmail,
  formatSize,
  isUrl,
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  runtime,
  fetchJson,
  sleep
} = require('./lib/myfunc');
const {
  welcomeBanner,
  promoteBanner
} = require("./lib/welcome");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => {
return new Promise((resolve) => { rl.question(text, resolve) });
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const WaSocket = makeWASocket({
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: true, 
        version: (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        logger: pino({
            level: 'silent'
        }),
        auth: state
    });

    if (!WaSocket.authState.creds.registered) {
        console.log(chalk.hex("#6c5ce7")(`PDF's WaBot Has Been Started`));

const phoneNumber = await question(chalk.hex("#6c5ce7")(`Input Ur Number Starts With 62 (WITHOUT +/-) :\n`));
       const code = await WaSocket.requestPairingCode(phoneNumber, "D7EPPELI");
        console.log(chalk.hex("#6c5ce7")(`Ur Pairing Code :\n${code} `));
    }

    const store = {};
    WaSocket.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else return jid;
    };

    WaSocket.ev.on('messages.upsert', async chatUpdate => {
        try {
            mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
              WaSocket.readMessages([mek.key]) 
            };
            if (!WaSocket.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('73PPELI') && mek.key.id.length === 16) return;
            let m = smsg(WaSocket, mek, store);
            require("./command.js")(WaSocket, m, chatUpdate, store);
        } catch (error) {
            console.error("Error processing message upsert:", error);
        }
    });

    WaSocket.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext);
        if (data && save) fs.promises.writeFile(filename, data);
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    WaSocket.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    WaSocket.sendText = (jid, text, quoted = '', options) => WaSocket.sendMessage(jid, { text, ...options }, { quoted });

    WaSocket.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
		const buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
		let buffer
	 if (options && (options.packname || options.author)) {
            buffer = await writeExif(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
		await WaSocket.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
		return buff;
	}

    WaSocket.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff);
        await WaSocket.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    WaSocket.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    WaSocket.sendMedia = async (jid, path, caption = '', quoted = '', options = {}) => {
        let { mime, data } = await WaSocket.getFile(path, true);
        let messageType = mime.split('/')[0];
        let messageContent = {};
        
        if (messageType === 'image') {
            messageContent = { image: data, caption: caption, ...options };
        } else if (messageType === 'video') {
            messageContent = { video: data, caption: caption, ...options };
        } else if (messageType === 'audio') {
            messageContent = { audio: data, ptt: options.ptt || false, ...options };
        } else {
            messageContent = { document: data, mimetype: mime, fileName: options.fileName || 'file' };
        }

        await WaSocket.sendMessage(jid, messageContent, { quoted });
    };

    WaSocket.sendPoll = async (jid, question, options) => {
        const pollMessage = {
          botInvokeMessage: {
            message: {
              messageContextInfo: {
                messageSecret: crypto.randomBytes(32)
              }, 
              pollCreationMessageV3: {
                name: question,
                options: options.map(
                  option => (
                    {
                      optionName: option
                    }
                  )
                ),
                selectableCount: 1,
              }
            }
          }
        };

        await WaSocket.relayMessage(jid, pollMessage, {});
    };

    WaSocket.setStatus = async (status) => {
        await WaSocket.query({
            tag: 'iq',
            attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
            content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
        });
        console.log(chalk.yellow(`Status updated: ${status}`));
    };

    WaSocket.public = true;

    WaSocket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
          WaSocket.sendText(WaSocket.user.id, "Bot Has Connected, Information Channel: t.me/TenkaWaBails");
        }
    });

    WaSocket.ev.on('error', (err) => {
        console.error(chalk.red("Error: "), err.message || err);
    });

    WaSocket.ev.on('creds.update', saveCreds);
    
    WaSocket.ev.on('group-participants.update', async (update) => {
      const { id, author, participants, action } = update
      try {
        if (!WaSocket.public) return
        const metadata = await WaSocket.groupMetadata(id)
        for (let participant of participants) {
          let profile
          try {
            profile = await WaSocket.profilePictureUrl(participant, 'image')
          } catch {
            profile = 'https://telegra.ph/file/95670d63378f7f4210f03.png'
          }
          let text = ''
          if (action === 'add') {
            text =
              author.length < 1
                ? `@${participant.split('@')[0]} join via *link group*`
                : author !== participant
                ? `@${author.split('@')[0]} telah *menambahkan* @${participant.split('@')[0]} kedalam grup`
                : ''
            let img = await welcomeBanner(profile, participant.split('@')[0], metadata.subject, 'welcome')
            await WaSocket.sendMessage(id, {
              image: { url: img },
              caption: text,
              mentions: [participant, author],
            })
          } else if (action === 'remove') {
            text =
              author.length < 1
                ? `@${participant.split('@')[0]} leave group`
                : author !== participant
                ? `@${author.split('@')[0]} telah *mengeluarkan* @${participant.split('@')[0]} dari grup`
                : ''
            await WaSocket.sendMessage(id, { text, mentions: [participant, author] })
          } else if (action === 'promote') {
            let img = await promoteBanner(profile, participant.split('@')[0], metadata.subject, 'promote')
            text = `@${author.split('@')[0]} telah mempromote @${participant.split('@')[0]} sebagai admin`
            await WaSocket.sendMessage(id, {
              image: { url: img },
              caption: text,
              mentions: [author, participant],
            })
          } else if (action === 'demote') {
            text = `@${author.split('@')[0]} telah mendemote @${participant.split('@')[0]}`
            await WaSocket.sendMessage(id, { text, mentions: [author, participant] })
          }
        }
      } catch (e) {
        console.error(e)
      }
    })
}

connectToWhatsApp();
