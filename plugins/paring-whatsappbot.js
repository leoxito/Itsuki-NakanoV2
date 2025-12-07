import ws from 'ws';
let handler = async(m, { usedPrefix, conn, text }) => {
const limit = 20
// --- CAMBIO CLAVE ---
// Leemos desde global.conns
const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];

function dhms(ms) {
  var segundos = Math.floor(ms / 1000);
  var minutos = Math.floor(segundos / 60);
  var horas = Math.floor(minutos / 60);
  var días = Math.floor(horas / 24);

  segundos %= 60;
  minutos %= 60;
  horas %= 24;

  var resultado = "";
  if (días !== 0) {
    resultado += días + 'd '
  }
  if (horas !== 0) {
    resultado += horas + 'h '
  }
  if (minutos !== 0) {
    resultado += minutos + 'm '
  }
  if (segundos !== 0) {
    resultado += segundos + 's'
  }

  return resultado;
}

  const message = users.map((v, index) => `
    🍃 \`𝗜𝗧𝗦𝗨𝗞𝗜-𝗦𝗜𝗦𝗧𝗘𝗠 | 𝗕𝗢𝗧 𝗟𝗜𝗦𝗧 : ${index + 1}\`

> 🌱 \`ᴜsᴇʀ :\` @${v.user.jid.replace(/[^0-9]/g, '')}
> ✐ \`ɴᴏᴍʙʀᴇ: ${v.user.name || 'Desconocido'}\`
> ⏳️ \`ᴜᴘᴛɪᴍᴇ: ${v.uptime ? dhms(Date.now() - v.uptime) : "Desconocido"}\`
`).join('\n┈──────────────── ꒰ 🌟 ꒱\n');
let warn = `
    乂 INFO :
    
> *[🧃] El número de subbots activos supera el límite de ${limit} por lo que no se mostrará la lista con los tags.*
`
const totalUsers = users.length;
const replyMessage = totalUsers > limit ? warn : (message || 'Aun No Hay Sesiones Activas..');
const cap = `
> 💭 Hello +${m.sender.split('@')[0]}! Below is the list of active subbots on Itsuki Nakano

> 💾 Sesiones guardadas : ${await info(jadi)}
> 🤖 Sesiones Activas : ${totalUsers || '0'}

 ${replyMessage.trim()}
 `.trim();

conn.sendMessage(m.chat, {
                text: cap, 
                contextInfo: {
mentionedJid: conn.parseMention(cap),
                     externalAdReply: {
                        title: "",
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnail: await (await fetch("https://cdn.russellxz.click/69ae53cb.jpg")).buffer(),
                        sourceUrl: ''
                    }
}}, { quoted: m })
}
handler.help = ['botlist']
handler.tags = ['serbot']
handler.command = ['bots'] 
handler.rowner = true

export default handler

import fs from "fs/promises";
async function info(path) {
    try {
        const items = await fs.readdir(path);
        return items.length;
    } catch (err) {
        console.error("Error:", err);
        return 0;
    }
}