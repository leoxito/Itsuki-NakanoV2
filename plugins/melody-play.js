import fetch from 'node-fetch'
import yts from 'yt-search'

const API_BASE = 'http://64.20.54.50:30104/api/download/youtube'

// Cache para búsquedas recientes
const userSessions = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const sender = m.sender
  
  try {
    if (!text) {
      return conn.reply(m.chat, 
        `🌸 *ᴍᴇʟᴏᴅʏ ᴍᴜsɪᴄ*\n\n` +
        `✨ ᴘᴏʀ ғᴀᴠᴏʀ, ɪɴɢʀᴇsᴀ:\n` +
        `• ᴇʟ ɴᴏᴍʙʀᴇ ᴅᴇ ᴜɴᴀ ᴄᴀɴᴄɪóɴ\n` +
        `• ᴏ ᴜɴ ᴇɴʟᴀᴄᴇ ᴅᴇ ʏᴏᴜᴛᴜʙᴇ\n\n` +
        `ᴇᴊᴇᴍᴘʟᴏ: ${usedPrefix + command} bad bunny`, 
        m
      )
    }
    
    await m.react('🔍')
    
    // Verificar si es URL directa de YouTube
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    
    let videoInfo
    
    if (urlMatch) {
      // Es URL directa
      const videoId = urlMatch[1]
      const url = `https://youtu.be/${videoId}`
      
      try {
        const search = await yts({ videoId })
        videoInfo = search.videos[0] || null
        
        if (!videoInfo) {
          // Si no encuentra por videoId, intentar búsqueda general
          const searchAlt = await yts(url)
          videoInfo = searchAlt.videos.find(v => v.videoId === videoId) || searchAlt.all[0]
        }
      } catch (error) {
        console.log('Error en búsqueda directa:', error.message)
        // Intentar con búsqueda del texto completo
        const search = await yts(text)
        videoInfo = search.videos[0]
      }
    } else {
      // Es búsqueda por texto
      const search = await yts(text)
      if (!search?.videos?.length) {
        await m.react('❌')
        return conn.reply(m.chat, 
          '🍓 *ɴᴏ sᴇ ᴇɴᴄᴏɴᴛʀᴀʀᴏɴ ʀᴇsᴜʟᴛᴀᴅᴏs*\n\n' +
          '✨ ɪɴᴛᴇɴᴛᴀ ᴄᴏɴ:\n' +
          '• ᴏᴛʀᴏ ɴᴏᴍʙʀᴇ\n' +
          '• ᴏ ᴜɴ ᴇɴʟᴀᴄᴇ ᴅɪʀᴇᴄᴛᴏ ᴅᴇ ʏᴏᴜᴛᴜʙᴇ', 
          m
        )
      }
      videoInfo = search.videos[0]
    }
    
    if (!videoInfo || !videoInfo.url) {
      await m.react('❌')
      return conn.reply(m.chat, '🍓 *ɴᴏ sᴇ ᴘᴜᴅᴏ ᴏʙᴛᴇɴᴇʀ ɪɴғᴏʀᴍᴀᴄɪóɴ ᴅᴇʟ ᴠɪᴅᴇᴏ*', m)
    }
    
    // Verificar duración (máximo 30 minutos)
    if (videoInfo.seconds > 1800) {
      await m.react('⏰')
      return conn.reply(m.chat, 
        '⚠️ *ᴇʟ ᴠɪᴅᴇᴏ ᴇs ᴍᴜʏ ʟᴀʀɢᴏ*\n\n' +
        `ᴅᴜʀᴀᴄɪóɴ: ${videoInfo.timestamp}\n` +
        'ʟíᴍɪᴛᴇ: 30 ᴍɪɴᴜᴛᴏs\n\n' +
        '✨ ɪɴᴛᴇɴᴛᴀ ᴄᴏɴ ᴜɴ ᴠɪᴅᴇᴏ ᴍás ᴄᴏʀᴛᴏ', 
        m
      )
    }
    
    // Guardar sesión del usuario
    userSessions.set(sender, {
      videoInfo,
      timestamp: Date.now()
    })
    
    // Limpiar sesiones antiguas (más de 5 minutos)
    cleanupOldSessions()
    
    // Mostrar información y preguntar formato
    const message = `🌸 *ᴍᴇʟᴏᴅʏ ᴍᴜsɪᴄ* 🌸\n\n` +
      `🎵 *ᴛíᴛᴜʟᴏ:* ${videoInfo.title}\n` +
      `👨‍🎤 *ᴀʀᴛɪsᴛᴀ:* ${videoInfo.author?.name || videoInfo.author}\n` +
      `⏳ *ᴅᴜʀᴀᴄɪóɴ:* ${videoInfo.timestamp}\n` +
      `👀 *ᴠɪsᴛᴀs:* ${formatViews(videoInfo.views)}\n` +
      `📅 *ᴘᴜʙʟɪᴄᴀᴅᴏ:* ${videoInfo.ago || 'N/A'}\n\n` +
      `✨ *¿ǫᴜé ᴅᴇsᴇᴀs ᴅᴇsᴄᴀʀɢᴀʀ?*\n\n` +
      `𝟭  »  ᴀᴜᴅɪᴏ ᴍᴘ₃\n` +
      `𝟮  »  ᴠɪᴅᴇᴏ ᴍᴘ₄\n\n` +
      `ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴇsᴛᴇ ᴍᴇɴsᴀᴊᴇ ᴄᴏɴ:\n` +
      `• "1" ᴏ "audio" - ᴘᴀʀᴀ ᴀᴜᴅɪᴏ\n` +
      `• "2" ᴏ "video" - ᴘᴀʀᴀ ᴠɪᴅᴇᴏ`
    
    // Enviar mensaje con miniatura si está disponible
    if (videoInfo.thumbnail) {
      await conn.sendMessage(m.chat, {
        image: { url: videoInfo.thumbnail },
        caption: message
      }, { quoted: m })
    } else {
      await conn.reply(m.chat, message, m)
    }
    
    await m.react('✅')
    
  } catch (error) {
    console.error('Error en Melody:', error)
    await m.react('❌')
    return conn.reply(m.chat, 
      '🍓 *ᴏʜ ɴᴏ! ʜᴜʙᴏ ᴜɴ ᴇʀʀᴏʀ*\n\n' +
      '✨ ᴘᴏsɪʙʟᴇs ᴄᴀᴜsᴀs:\n' +
      '• ᴇʟ ᴠɪᴅᴇᴏ ɴᴏ ᴇsᴛá ᴅɪsᴘᴏɴɪʙʟᴇ\n' +
      '• ᴘʀᴏʙʟᴇᴍᴀ ᴅᴇ ᴄᴏɴᴇxɪóɴ\n' +
      '• ʟᴀ ʙúsǫᴜᴇᴅᴀ ᴇs ᴍᴜʏ ᴀᴍᴘʟɪᴀ\n\n' +
      '✨ ɪɴᴛᴇɴᴛᴀ:\n' +
      '• ᴄᴏɴ ᴜɴ ᴇɴʟᴀᴄᴇ ᴅɪʀᴇᴄᴛᴏ\n' +
      '• ᴏ ᴄᴏɴ ᴏᴛʀᴏ ᴛéʀᴍɪɴᴏ ᴅᴇ ʙúsǫᴜᴇᴅᴀ', 
      m
    )
  }
}

// Manejador para respuestas de usuario
const responseHandler = async (m, { conn }) => {
  const sender = m.sender
  let text = m.text?.trim()?.toLowerCase()
  
  // Si es un comando, no procesar
  if (text.startsWith('!') || text.startsWith('.') || text.startsWith('/')) {
    return
  }
  
  // Verificar si el usuario tiene una sesión activa
  if (!userSessions.has(sender)) return
  
  const session = userSessions.get(sender)
  
  // Verificar si la sesión ha expirado (5 minutos)
  if (Date.now() - session.timestamp > 300000) {
    userSessions.delete(sender)
    return conn.reply(m.chat, '⏰ *ʟᴀ sᴇsɪóɴ ʜᴀ ᴇxᴘɪʀᴀᴅᴏ*\n\n✨ ᴘᴏʀ ғᴀᴠᴏʀ, ᴜsᴀ ᴇʟ ᴄᴏᴍᴀɴᴅᴏ !melody ᴅᴇ ɴᴜᴇᴠᴏ', m)
  }
  
  // Limpiar el texto (quitar espacios y convertir a minúsculas)
  text = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  
  // Verificar si la respuesta es válida
  const isAudio = text === '1' || text === 'audio' || text === 'mp3' || text === 'musica' || text === 'song'
  const isVideo = text === '2' || text === 'video' || text === 'mp4' || text === 'vid' || text === 'pelicula'
  
  if (!isAudio && !isVideo) {
    return conn.reply(m.chat, 
      '🍓 *ᴏᴘᴄɪóɴ ɴᴏ ᴠáʟɪᴅᴀ*\n\n' +
      '✨ ᴘᴏʀ ғᴀᴠᴏʀ, ʀᴇsᴘᴏɴᴅᴇ ᴄᴏɴ:\n' +
      '• "1" ᴏ "audio" - ᴘᴀʀᴀ ᴀᴜᴅɪᴏ ᴍᴘ₃\n' +
      '• "2" ᴏ "video" - ᴘᴀʀᴀ ᴠɪᴅᴇᴏ ᴍᴘ₄\n\n' +
      'ᴏ ᴠᴜᴇʟᴠᴇ ᴀ ᴜsᴀʀ: !melody [ʙúsǫᴜᴇᴅᴀ]', 
      m
    )
  }
  
  const videoInfo = session.videoInfo
  
  try {
    await m.react('⏳')
    
    // Mostrar mensaje de procesamiento
    const processingMsg = await conn.reply(m.chat, 
      `🌸 *ᴘʀᴏᴄᴇsᴀɴᴅᴏ ${isAudio ? 'ᴀᴜᴅɪᴏ' : 'ᴠɪᴅᴇᴏ'}...*\n\n` +
      `✨ ${videoInfo.title.substring(0, 70)}${videoInfo.title.length > 70 ? '...' : ''}\n` +
      `👨‍🎤 ${videoInfo.author?.name || videoInfo.author}\n` +
      `⏳ ${videoInfo.timestamp}\n\n` +
      `🍓 ᴇsᴛᴏ ᴘᴜᴇᴅᴇ ᴛᴏᴍᴀʀ ᴜɴᴏs sᴇɢᴜɴᴅᴏs...`, 
      m
    )
    
    // Crear URL de descarga según la API
    const downloadUrl = isAudio 
      ? `${API_BASE}/mp3?url=${encodeURIComponent(videoInfo.url)}`
      : `${API_BASE}/mp4?url=${encodeURIComponent(videoInfo.url)}`
    
    console.log('URL de descarga:', downloadUrl)
    
    // Configurar timeout (20 segundos máximo)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    
    // Intentar descargar el archivo
    try {
      if (isAudio) {
        // Para audio
        await conn.sendMessage(m.chat, {
          audio: { url: downloadUrl },
          fileName: `${cleanFileName(videoInfo.title)}.mp3`,
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: m })
      } else {
        // Para video
        await conn.sendMessage(m.chat, {
          video: { url: downloadUrl },
          caption: `🌸 *ᴠɪᴅᴇᴏ ᴅᴇsᴄᴀʀɢᴀᴅᴏ* 🌸\n\n` +
                   `🎬 ${videoInfo.title}\n` +
                   `✨ ${videoInfo.author?.name || videoInfo.author}\n` +
                   `⏳ ${videoInfo.timestamp}\n` +
                   `👀 ${formatViews(videoInfo.views)}\n\n` +
                   `🍓 ǫᴜᴇ ʟᴏ ᴅɪsғʀᴜᴛᴇs!`,
          fileName: `${cleanFileName(videoInfo.title)}.mp4`,
          mimetype: 'video/mp4'
        }, { quoted: m })
      }
      
      clearTimeout(timeoutId)
      
      // Eliminar mensaje de procesamiento si es posible
      try {
        await conn.sendMessage(m.chat, { 
          delete: processingMsg.key 
        })
      } catch (e) {
        console.log('No se pudo eliminar mensaje de procesamiento:', e.message)
      }
      
      // Limpiar sesión
      userSessions.delete(sender)
      
      await m.react('✅')
      
    } catch (downloadError) {
      clearTimeout(timeoutId)
      console.error('Error en descarga directa:', downloadError.message)
      
      // Si falla, intentar método alternativo - descarga directa desde la API
      try {
        await conn.reply(m.chat, '🍓 *ɪɴᴛᴇɴᴛᴀɴᴅᴏ ᴍéᴛᴏᴅᴏ ᴀʟᴛᴇʀɴᴀᴛɪᴠᴏ...*, m)
        
        // Enviar directamente el archivo desde la URL
        if (isAudio) {
          await conn.sendMessage(m.chat, {
            audio: { url: downloadUrl },
            fileName: `${cleanFileName(videoInfo.title)}.mp3`,
            mimetype: 'audio/mpeg'
          }, { quoted: m })
        } else {
          await conn.sendMessage(m.chat, {
            video: { url: downloadUrl },
            caption: `🌸 *ᴠɪᴅᴇᴏ ᴅᴇsᴄᴀʀɢᴀᴅᴏ* 🌸\n\n🍓 ᴅɪsғʀᴜᴛᴀ ᴛᴜ ᴄᴏɴᴛᴇɴɪᴅᴏ!`,
            fileName: `${cleanFileName(videoInfo.title)}.mp4`
          }, { quoted: m })
        }
        
        // Eliminar mensaje de procesamiento
        try {
          await conn.sendMessage(m.chat, { 
            delete: processingMsg.key 
          })
        } catch {}
        
        userSessions.delete(sender)
        await m.react('✅')
        
      } catch (altError) {
        console.error('Error en método alternativo:', altError.message)
        
        // Limpiar sesión
        userSessions.delete(sender)
        
        await m.react('❌')
        return conn.reply(m.chat, 
          '🍓 *ɴᴏ sᴇ ᴘᴜᴅᴏ ᴄᴏɴᴇᴄᴛᴀʀ ᴄᴏɴ ᴇʟ sᴇʀᴠɪᴅᴏʀ*\n\n' +
          '✨ ᴘᴏsɪʙʟᴇs ᴄᴀᴜsᴀs:\n' +
          '• ᴇʟ sᴇʀᴠɪᴅᴏʀ ᴇsᴛá ᴏғғʟɪɴᴇ\n' +
          '• ᴇʟ ᴠɪᴅᴇᴏ ᴇsᴛá ʀᴇsᴛʀɪɴɢɪᴅᴏ\n' +
          '• ᴘʀᴏʙʟᴇᴍᴀ ᴅᴇ ᴄᴏɴᴇxɪóɴ\n\n' +
          '✨ ɪɴᴛᴇɴᴛᴀ:\n' +
          '• ᴇsᴘᴇʀᴀ ᴜɴᴏs ᴍɪɴᴜᴛᴏs\n' +
          '• ᴏ ᴜsᴀ ᴏᴛʀᴏ ᴇɴʟᴀᴄᴇ', 
          m
        )
      }
    }
    
  } catch (error) {
    console.error('Error general en respuesta:', error)
    await m.react('❌')
    
    // Limpiar sesión en caso de error
    userSessions.delete(sender)
    
    return conn.reply(m.chat, 
      '🍓 *ᴏᴄᴜʀʀɪó ᴜɴ ᴇʀʀᴏʀ ɪɴᴇsᴘᴇʀᴀᴅᴏ*\n\n' +
      '✨ ᴘᴏʀ ғᴀᴠᴏʀ, ɪɴᴛᴇɴᴛᴀ:\n' +
      '1. Usar !melody de nuevo\n' +
      '2. Con un enlace directo de YouTube\n' +
      '3. Esperar unos minutos', 
      m
    )
  }
}

// Función para limpiar sesiones antiguas
function cleanupOldSessions() {
  const now = Date.now()
  for (const [sender, session] of userSessions.entries()) {
    if (now - session.timestamp > 300000) { // 5 minutos
      userSessions.delete(sender)
    }
  }
}

// Funciones auxiliares
function formatViews(views) {
  if (!views || isNaN(views)) return "0"
  const numViews = parseInt(views)
  if (numViews >= 1000000000) return `${(numViews / 1000000000).toFixed(1)}B`
  if (numViews >= 1000000) return `${(numViews / 1000000).toFixed(1)}M`
  if (numViews >= 1000) return `${(numViews / 1000).toFixed(1)}K`
  return numViews.toString()
}

function cleanFileName(name) {
  if (!name) return 'melody_download'
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
}

// Configuración de comandos
handler.help = ['melody']
handler.tags = ['downloader', 'music']
handler.command = ['melody', 'mel', 'melly', 'play10']

// Exportar handlers
export {
  handler as default,
  responseHandler as melodyResponse
}

// Instrucciones para usar en el archivo principal:
/*
import melodyHandler, { melodyResponse } from './melody.js'

// Registrar comando principal
conn.commands.set('melody', melodyHandler)
conn.commands.set('play3', melodyHandler) // También responde a play3

// En el manejador de mensajes, agregar:
conn.on('message', async (m) => {
  if (!m.message || !m.text) return
  
  // Solo procesar respuestas que no sean comandos
  const text = m.text.trim()
  if (!text.startsWith('!') && !text.startsWith('.') && !text.startsWith('/')) {
    await melodyResponse(m, { conn })
  }
})
*/
