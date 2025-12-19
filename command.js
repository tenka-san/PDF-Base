const fs = require('fs');
const axios = require('axios');
const didyoumean = require('didyoumean');
const path = require('path');
const chalk = require("chalk");
const util = require("util");
const moment = require("moment-timezone");
const speed = require('performance-now');
const similarity = require('similarity');
const { spawn, exec, execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const {
  default: makeWASocket, 
  proto, 
  generateWAMessage, 
  generateWAMessageFromContent, 
  getContentType, 
  prepareWAMessageMedia, 
  baileys
} = require("@whiskeysockets/baileys");
module.exports = WaSocket = async (WaSocket, m, chatUpdate, store) => {
try {
  const body = (
    m.mtype === "conversation" ? m.message.conversation :
    m.mtype === "imageMessage" ? m.message.imageMessage.caption :
    m.mtype === "videoMessage" ? m.message.videoMessage.caption :
    m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
    m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
    m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
    m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
    m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
    m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
    m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text : ""
  );

  const sender = m.key.fromMe
    ? WaSocket.user.id.split(":")[0] || WaSocket.user.id
    : m.key.participant || m.key.remoteJid;

  const senderNumber = sender.split('@')[0];
  const budy = (typeof m.text === 'string' ? m.text : '');
  const prefa = ["", "!", ".", ",", "🐤", "🗿"];
  const prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? prefa;
  const from = m.key.remoteJid;
  const isGroup = from.endsWith("@g.us");
  const isChannel = from.endsWith("@newsletter");
  const botNumber = await WaSocket.decodeJid(WaSocket.user.id);
  const owners = JSON.parse(fs.readFileSync('./lib/DataBases/owners.json'));
  const isOwner = [botNumber, ...owners].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
  const isBot = botNumber.includes(senderNumber)
  const isCmd = body.startsWith(prefix) ? true : false
  const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : "";
  const args = body.trim().split(/ +/).slice(1);
  const pushname = m.pushName || "PDF's - WaBot";
  const text = q = args.join(" ");
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || '';
  const qmsg = (quoted.msg || quoted);
  const isMedia = /image|video|sticker|audio/.test(mime);
  const groupMetadata = isGroup ? await WaSocket.groupMetadata(m.chat).catch((e) => {}) : "";
  const groupOwner = isGroup ? groupMetadata.owner : "";
  const groupName = m.isGroup ? groupMetadata.subject : "";
  const participants = isGroup ? await groupMetadata.participants : "";
  const groupAdmins = isGroup ? await participants.filter((v) => v.admin !== null).map((v) => v.id) : "";
  const groupMembers = isGroup ? groupMetadata.participants : "";
  const isGroupAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
  const isBotGroupAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
  const isBotAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
  const isAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
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
  const time = moment.tz("Asia/Jakarta").format("HH:mm:ss");
  const x = {
    key: {
      participant: "13135550002@s.whatsapp.net", 
      remoteJid: "status@broadcast", 
      fromMe: false
    }, 
    message: {
      conversation: "! PDF's WaBot !"
    }
  };
  const reply = (text) => {
    const msg = {
      text, 
      mentions: [m.sender], 
      contextInfo: {
        externalAdReply: {
          title: "PDF's WaBot", 
          body: "7eppeli.pdf", 
          thumbnailUrl: "https://files.catbox.moe/ae7lmh.jpg", 
          sourceUrl: "https://t.me/YuukeyD7eppeli", 
          showAdAttribution: false
        }
      }
    };
    return WaSocket.sendMessage(m.chat, msg, {
      quoted: x
    })
  }

  switch (command) {
    case "menu": {
      const teks = `PDF's Was Created By @YuukeyD7eppeli`;
      const msg = {
        interactiveMessage: {
          title: teks, 
          image: fs.readFileSync('./Images/img.jpg'), 
          nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
              limited_time_offer: {
                text: "PDF's WaBot",
                url: "t.me/YuukeyD7eppeli",
                copy_code: "7eppeli.pdf",
                expiration_time: Date.now() * 999
              },
              bottom_sheet: {
                in_thread_buttons_limit: 2,
                divider_indices: [1, 2, 3, 4, 5, 999],
                list_title: "PDF's WaBot",
                button_title: "PDF's Family"
              }
            }),
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "Telegram Creator",
                  url: "https://t.me/YuukeyD7eppeli"
                })
              }, 
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "System Info", 
                  id: "systeminfo"
                })
              }, 
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "Thanks To", 
                  id: "tqto"
                })
              }, 
              {
                name: "address_message",
                buttonParamsJson: "{}"
              }
            ]
          }
        }
      };
  
      WaSocket.sendMessage(m.chat, msg, {
        quoted: x
      })
    }
    break;
    case "systeminfo": {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
                
      const usedGB = Math.floor(usedMem / 1024 / 1024 / 1024);
      const totalGB = Math.floor(totalMem / 1024 / 1024 / 1024);
                
      let timestamp = Date.now();
      let latensi = Date.now() - timestamp;

      WaSocket.sendMessage(m.chat, { 
        pollResultMessage: { 
          name: "System Info", 
          pollVotes: [
            {
              optionName: "Speed (ms)",
              optionVoteCount: Math.max(1, Math.floor(latensi)) 
            },
            {
              optionName: "RAM Used (GB)",
              optionVoteCount: usedGB
            },
            {
              optionName: "Total RAM (GB)",
              optionVoteCount: totalGB
            }
          ], 
          newsletter: {
            newsletterJid: "120363425000320171@newsletter", 
            newsletterName: "PDF's Team | Information"
          }
        } 
      }, { quoted: x });
    }
    break;
    case "tqto": {
      const teks = `There's My Family who help me in 2025 - 2026`;
      const msg = {
        interactiveMessage: {
          title: teks, 
          image: fs.readFileSync('./Images/img.jpg'), 
          nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
              limited_time_offer: {
                text: "PDF's WaBot",
                url: "t.me/YuukeyD7eppeli",
                copy_code: "7eppeli.pdf",
                expiration_time: Date.now() * 999
              },
              bottom_sheet: {
                in_thread_buttons_limit: 1,
                divider_indices: [1, 2, 3, 4, 5, 999],
                list_title: "PDF's WaBot",
                button_title: "PDF's Family"
              }
            }),
            buttons: [
              {
                name: "galaxy_message", 
                buttonParamsJson: JSON.stringify({
                  flow_cta: "╭───「 PDF's Family 」", 
                  flow_message_version: "3", 
                  flow_id: ".menu"
                })
              }, 
              {
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  flow_cta: "│ ▢ 7eppeli.pdf", 
                  flow_message_version: "3", 
                  flow_id: ".menu"
                })
              }, 
              {
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  flow_cta: "│ ▢ Jhonixhox.pdf", 
                  flow_message_version: "3", 
                  flow_id: ".menu"
                })
              }, 
              {
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  flow_cta: "│ ▢ X$-thanror(.pdf?)", 
                  flow_message_version: "3", 
                  flow_id: ".menu"
                })
              }, 
              {
                name: "galaxy_message",
                buttonParamsJson: JSON.stringify({
                  flow_cta: "│ ▢ X4$-shaka.pdf ( Kelra )", 
                  flow_message_version: "3", 
                  flow_id: ".menu"
                })
              }, 
              {
                name: "galaxy_message", 
                buttonParamsJson: JSON.stringify({
                  flow_cta: "╰──────────⊱", 
                  flow_message_version: "3", 
                  flow_id: ".menu"
                })
              }
            ]
          }
        }
      };
  
      WaSocket.sendMessage(m.chat, msg, {
        quoted: x
      })
    }
    break;
    case "info": {
      const infogetclone1 = m.quoted ? {
        [m.quoted.mtype]:m.quoted
      } : {
        [m.message.mtype]:m.message
      };
      const formattedJson = JSON.stringify(infogetclone1, null, 2);
      reply(`${formattedJson}`)
    }
    break;
    case "meid": {
      reply(`${WaSocket.user.id}`)
    }
    break;
    case "tsid": {
      reply(`${m.chat}`)
    }
    break;
    case "invtag": {
      if (!isAdmins) return reply("Hanya admin yang dapat menggunakan perintah ini")
      if (!isBotAdmins) return reply("Hanya admin yang dapat menggunakan perintah ini")
      let member = groupMetadata.participants.map(e => e.id)
      await WaSocket.relayMessage(m.chat, {
        albumMessage: {
          contextInfo: {
            mentionedJid: [...member]
          }
        }
      }, {})
    }
    break;
    default:
      if (budy.startsWith('>')) {
        if (!isOwner) return;
        try {
          let evaled = await eval(budy.slice(2));
          if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
          reply(evaled);
        } catch (err) {
          reply(String(err));
        }
      }
    }
  } catch (err) {
    console.log(require("util").format(err));
  }
};

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file);
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
  delete require.cache[file];
  require(file);
});
