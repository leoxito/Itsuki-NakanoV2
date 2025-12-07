import pkg from '@whiskeysockets/baileys'
const { useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason, generateWAMessageFromContent, proto, prepareWAMessageMedia } = pkg
import pino from "pino";
// Asegúrate de que './lib/simple.js' existe y exporta makeWASocket, protoType, y serialize
import { protoType, serialize, makeWASocket } from './lib/simple.js' 
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'

// Importamos el handler principal para que los sub-bots puedan procesar mensajes
let mainHandler
try {
  // Se asume que handler.js existe en la raíz y exporta 'handler'
  ({ handler: mainHandler } = await import('./handler.js')) 
} catch (e) {
  console.error('[SUBBOT] Error importando handler principal:', e.message || e)
}

if (!global.subbots) global.subbots = []

/**
 * Inicia o reconecta una sesión de Sub-Bot.
 * @param {string} userName - Nombre de usuario (nombre de la carpeta de sesión).
 * @param {import('@whiskeysockets/baileys').WASocket} conn - Conexión del bot principal.
 * @param {object | null} m - Mensaje del chat si es un comando (es null en la auto-reconexión).
 */
export const startSubBot = async (userName, conn, m) => {
  const folder = path.join('Sessions/SubBot', userName)

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

  if (m) await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  if (m) await conn.sendPresenceUpdate('composing', m.chat)

  try {
    const { state, saveCreds } = await useMultiFileAuthState(folder)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      // --- 🔑 ESTABILIDAD: Keepalive y Persistencia ---
      keepAliveIntervalMs: 30000, 
      getMessage: async key => ({ conversation: 'keepalive' }) 
    })

    sock.id = userName
    sock.saveCreds = saveCreds
    let pairingCodeSent = false

    try {
      protoType()
      serialize()
    } catch (e) { console.log(e) }

    // El Sub-Bot usa el mismo handler de mensajes
    if (mainHandler) {
      sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
          // 'call(sock, chatUpdate)' hace que 'sock' sea la conexión actual (el sub-bot)
          await mainHandler.call(sock, chatUpdate) 
        } catch (e) {
          console.error(`Error en handler subbot (${userName}):`, e)
        }
      })
    }

    sock.ev.on('creds.update', saveCreds)

    // Lógica de conexión y auto-reconexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'open') {
        sock.__sessionOpenAt = Date.now()
        sock.connection = 'open'
        sock.uptime = new Date()

        global.subbots = global.subbots.filter(c => c.id !== userName)
        global.subbots.push(sock)

        if (m) {
          await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
          await conn.reply(m.chat, '> [🌱] 𝙎𝙪𝙗-𝙗𝙤𝙩 𝘾𝙤𝙣𝙚𝙘𝙩𝙖𝙙𝙤 𝙀𝙭𝙞𝙩𝙤𝙨𝙖మె𝙣𝙩𝙚', m)
        } else {
             // Decoración para la auto-reconexión
             const successLog = `\n╭─────────────────────────────◉\n│ ${chalk.black.bgGreenBright.bold('     ✅ SUB-BOT RECONECTADO     ')}\n│ 「 🤖 」${chalk.yellow(`Sesión: ${userName}`)}\n│ 「 🟢 」${chalk.white('Estado: ACTIVO')}\n╰─────────────────────────────◉\n`
             console.log(successLog)
        }
      }

      if (connection === 'close') {
        global.subbots = global.subbots.filter(c => c.id !== userName)
        const reason = lastDisconnect?.error?.output?.statusCode || 0

        if (m) await conn.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } })

        // 🛑 Borrado de sesión si se desvincula manualmente
        if (reason === DisconnectReason.loggedOut) {
          fs.rmSync(folder, { recursive: true, force: true })
          if(m) return conn.reply(m.chat, `> [🔴] 𝐒𝐄𝐒𝐈Ó𝐍 𝐄𝐋𝐈𝐌𝐈𝐍𝐀𝐃𝐀.`, m)
          return
        }

        const reconnectDelay = 15000; // Retraso de 15 segundos
        
        if (m) {
            conn.reply(m.chat, `> [🔴] 𝐂𝐎𝐍𝐄𝐗𝐈𝐎𝐍 𝐂𝐄𝐑𝐑𝐀𝐃𝐀.... 𝐑𝐞𝐜𝐨𝐧𝐞𝐜𝐭𝐚𝐧𝐝𝐨 𝐞𝐧 ${reconnectDelay / 1000}𝐬.`, m)
        } else {
            console.log(chalk.red(`[SUBBOT] Sesión ${userName} cerrada. Reconectando en ${reconnectDelay / 1000}s...`))
        }
        
        setTimeout(() => {
          startSubBot(userName, conn, m) 
        }, reconnectDelay)
      }
    })
    
    // Lógica de generación de pairing code
    if (!state.creds?.registered && !pairingCodeSent && m) {
      pairingCodeSent = true

      await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

      setTimeout(async () => {
        try {
            const rawCode = await sock.requestPairingCode(userName)
            await conn.sendMessage(m.chat, { react: { text: '✅️', key: m.key } })
            
            // --- 👑 TU CÓDIGO DE BOTONES Y DECORACIÓN (RESTORED) 👑 ---
            const imageUrl = 'https://cdn.russellxz.click/73109d7e.jpg'
            const media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer })

            const header = proto.Message.InteractiveMessage.Header.fromObject({
              hasMediaAttachment: true,
              imageMessage: media.imageMessage
            })

            const interactiveMessage = proto.Message.InteractiveMessage.fromObject({
              header,
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: `> *❀ OPCIÓN-CODIGO ❀*
  
𓂃 ࣪ ִֶָ☾.  
> 1. 📲 *WhatsApp → Ajustes* > 2. ⛓️‍💥 *Dispositivos vinculados* > 3. 🔐 *Toca vincular* > 4. ✨ Copia este código:
  
> ˗ˏˋ ꕤ  ${rawCode.match(/.{1,4}/g)?.join(' ⸰ ')}  ꕤ ˎˊ˗
  
> ⌛ ⋮ *10 segundos de magia* > 🍒 ࣪𓂃 *¡Consejito dale rapidito!* ˚₊‧꒰ა ♡ ໒꒱ ‧₊˚`
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: "ᴄᴏᴘɪᴀ ᴇʟ ᴄᴏᴅɪɢᴏ ᴀǫᴜɪ ᴀʙᴀᴊᴏ 🌺"
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                buttons: [
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({ display_text: "𝗖𝗼𝗽𝗶𝗮 𝗘𝗹 𝗖𝗼𝗱𝗶𝗴𝗼 📋", copy_code: rawCode })
                  },
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({ display_text: "𝗖𝗮𝗻𝗮𝗹 𝗢𝗳𝗶𝗰𝗮𝗹 🌷", url: "https://whatsapp.com/channel/0029VbBvZH5LNSa4ovSSbQ2N" })
                  }
                ]
              })
            })

            const msg = generateWAMessageFromContent(m.chat, { interactiveMessage }, { userJid: conn.user.jid, quoted: m })
            await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
            // ----------------------------------------------------

          } catch (err) {
            console.error('Error al obtener pairing code:', err)
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            await conn.reply(m.chat, `*⚙️ Error: ${err.message}*`, m)
          }
        }, 3000)
    }

  } catch (error) {
    console.error('Error al crear socket:', error)
    if (m) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
        await conn.reply(m.chat, `Error critico: ${error.message}`, m)
    }
  }
}

export { startSubBot }
