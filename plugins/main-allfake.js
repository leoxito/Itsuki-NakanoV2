import fs from 'fs'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'

var handler = m => m
handler.all = async function (m) { 
global.canalIdM = [
  "120363404434164076@newsletter",
  "120363403726798403@newsletter",
  "120363425526390282@newsletter",
  "120363404434164076@newsletter"
]

global.canalNombreM = [
  "꒰ ❄️ ITՏᑌKI ᑎᗩKᗩᑎO-ᐯ3 ᑌᑭᗪᗰTᗴ ☃️ ꒱", 
  "𝆺𝅥 𝆭 ִ ֗ ❄ 𝐋𝐚𝐬 𝐐𝐮𝐢𝐧𝐭𝐢𝐥𝐥𝐢𝐬𝐚𝐬-𝐍𝐨𝐯𝐞𝐝𝐚𝐝 📢 ┆ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥-𝐈𝐧𝐟𝐨 ☃️ ˚₊‧",
  "𝗠𝗘𝗠𝗘𝗦 🧃➜ 𝗦𝗧𝗜𝗖𝗞𝗘𝗥 𝗘𝗗𝗜𝗧 𝗬 𝗠𝗔𝗦 💭",
  "𝐥𝐞𝐨 » 𝐔𝐩𝐝𝐚𝐭𝐞 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 ❄️"
]

global.channelRD = await getRandomChannel()

global.d = new Date(new Date + 3600000)
global.locale = 'es'
global.dia = d.toLocaleDateString(locale, {weekday: 'long'})
global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})
global.mes = d.toLocaleDateString('es', {month: 'long'})
global.año = d.toLocaleDateString('es', {year: 'numeric'})
global.tiempo = d.toLocaleString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true})

global.nombre = m.pushName || 'User-MD'
global.packsticker = ``

global.iconos = [
  'https://cdn.russellxz.click/a015cecd.jpg',
  'https://cdn.russellxz.click/d112a400.jpg',
  'https://cdn.russellxz.click/40fb346f.jpg',
  'https://cdn.russellxz.click/d8cefbd9.jpg',
  'https://cdn.russellxz.click/1d6aa06f.jpg',
  'https://cdn.russellxz.click/8df6a43c.jpg',
  'https://cdn.russellxz.click/0d27e894.jpg',
  'https://cdn.russellxz.click/98e7e0df.jpg',
  'https://cdn.russellxz.click/b262e815.jpg',
  'https://cdn.russellxz.click/f46d62d3.jpg',
  'https://cdn.russellxz.click/36caddb4.jpg'
]
global.icono = global.iconos[Math.floor(Math.random() * global.iconos.length)]

global.wm = '© 𝐋𝐞𝐨  𝐗𝐬𝐳𝐲'
global.wm3 = '⫹⫺ 𝙈𝙪𝙡𝙩𝙞-𝘿𝙚𝙫𝙞𝙘𝙚 💻'
global.author = '👑 ᗰᗩᗪᗴ ᗷY ᒪᗴO 🧃'
global.dev = '© 𝙾𝚆𝙽𝙴𝚁-𝙻𝙴𝙾 𝙳𝙴𝚅 👑'
global.textbot = 'Itsuki-Nakano|IAV3 Leo'
global.etiqueta = '@Leo Xzsy'
global.gt = '© 𝐂𝐫𝐞𝐚𝐝𝐨 𝐏𝐨𝐫 𝐋𝐞𝐨𝐃𝐞𝐯 𝐈𝐭𝐬𝐮𝐤𝐢-𝐂𝐡𝐚𝐧 𝐓𝐡𝐞 𝐁𝐞𝐬𝐭 𝐁𝐨𝐭𝐬 𝐎𝐟 𝐖𝐡𝐚𝐭𝐬𝐚𝐩𝐩 🤖👑'
global.me = '🌨️ 𝙸𝚃𝚂𝚄𝙺𝙸 𝙽𝙰𝙺𝙰𝙽𝙾 𝙼𝙴𝚆 𝚄𝙿𝙳𝙰𝚃𝙴 ☃️'

global.fkontak = { 
  key: { 
    participants: "0@s.whatsapp.net", 
    remoteJid: "status@broadcast", 
    fromMe: false, 
    id: "Halo" 
  }, 
  message: { 
    contactMessage: { 
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` 
    }
  }, 
  participant: "0@s.whatsapp.net" 
}

global.rcanal = { 
  contextInfo: { 
    isForwarded: true, 
    forwardedNewsletterMessageInfo: { 
      newsletterJid: channelRD.id, 
      serverMessageId: '', 
      newsletterName: channelRD.name 
    }, 
    externalAdReply: { 
      title: global.botname, 
      body: global.dev, 
      mediaUrl: null, 
      description: null, 
      previewType: "PHOTO", 
      thumbnailUrl: global.icono,
      sourceUrl: '', 
      mediaType: 1, 
      renderLargerThumbnail: false 
    }, 
    mentionedJid: null 
  }
}

global.listo = '*Aqui tiene*'
global.moneda = 'Yenes'
global.prefix = ['.', '!', '/', '#', '%']
}

export default handler

function pickRandom(list) {
return list[Math.floor(Math.random() * list.length)]
}

async function getRandomChannel() {
let randomIndex = Math.floor(Math.random() * global.canalIdM.length)
let id = global.canalIdM[randomIndex]
let name = global.canalNombreM[randomIndex]
return { id, name }
}

if (!Array.prototype.getRandom) {
Array.prototype.getRandom = function() {
return this[Math.floor(Math.random() * this.length)]
}
}