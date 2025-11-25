import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `🎄 *¿Y qué quieres que busque en TikTok sin decirme nada?* 🎅

> ❌ *Uso incorrecto*

> \`\`\`Debes proporcionar un enlace o término de búsqueda\`\`\`

> 🎅 *¡Itsuki Nakano V3 buscará en TikTok para ti!* 🎁`, m)
  }

  const isUrl = /(?:https:?\/{2})?(?:www\.|vm\.|vt\.|t\.)?tiktok\.com\/([^\s&]+)/gi.test(text)
  try {
    await m.react('🎄')

    if (isUrl) {
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}?hd=1`)
      const data = res.data?.data
      if (!data?.play && !data?.music) return conn.reply(m.chat, '🎅 *¡ERROR NAVIDEÑO!*\n\n> ❌ Enlace inválido o sin contenido descargable.\n> 🎄 ¡Itsuki V3 no pudo encontrar el contenido! 🎁', m)

      const { title, duration, author, created_at, type, images, music, play } = data

      // Si el comando es para audio
      if (command === 'tiktokaudio' || command === 'tta' || command === 'ttaudio') {
        if (!music) {
          return conn.reply(m.chat, `🎅 *¡ERROR NAVIDEÑO!*\n\n> ❌ No se pudo obtener el audio del video.\n> 🎄 ¡Itsuki V3 no encontró audio disponible! 🎁`, m)
        }

        await conn.sendMessage(
          m.chat,
          {
            audio: { url: music },
            mimetype: 'audio/mpeg',
            fileName: `audio_tiktok_navidad.mp3`,
            ptt: false
          },
          { quoted: m }
        )

        await m.react('✅')
        return
      }

      // Comando normal de TikTok (video/imagen)
      const caption = createCaption(title, author, duration, created_at)

      if (type === 'image' && Array.isArray(images)) {
        const medias = images.map(url => ({ type: 'image', data: { url }, caption }))
        await conn.sendSylphy(m.chat, medias, { quoted: m })

        if (music) {
          await conn.sendMessage(m.chat, { 
            audio: { url: music }, 
            mimetype: 'audio/mp4', 
            fileName: 'audio_navidad.mp4' 
          }, { quoted: m })
        }
      } else {
        await conn.sendMessage(m.chat, { video: { url: play }, caption }, { quoted: m })
      }

    } else {
      // Búsqueda por texto (solo para comando normal)
      if (command === 'tiktokaudio' || command === 'tta' || command === 'ttaudio') {
        return conn.reply(m.chat, `🎅 *¡ERROR NAVIDEÑO!*\n\n> ❌ Para descargar audio necesitas un enlace de TikTok.\n> 🎄 ¡Itsuki V3 necesita un enlace específico! 🎁`, m)
      }

      const res = await axios({
        method: 'POST',
        url: 'https://tikwm.com/api/feed/search',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': 'current_language=en',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36' 
        },
        data: { keywords: text, count: 20, cursor: 0, HD: 1 }
      })

      const results = res.data?.data?.videos?.filter(v => v.play) || []
      if (results.length < 2) return conn.reply(m.chat, '🎅 *¡ERROR NAVIDEÑO!*\n\n> ❌ Se requieren al menos 2 resultados válidos con contenido.\n> 🎄 ¡Itsuki V3 no encontró suficientes videos! 🎁', m)

      const medias = results.slice(0, 10).map(v => ({
        type: 'video',
        data: { url: v.play },
        caption: createSearchCaption(v)
      }))
      await conn.sendSylphy(m.chat, medias, { quoted: m })
    }

    await m.react('✅')
  } catch (e) {
    await m.react('❌')
    await conn.reply(m.chat, `🎅 *¡ERROR NAVIDEÑO!*

> ❌ *Oops, algo salió mal...*

> 📝 *Detalles:*
\`\`\`${e.message}\`\`\`

> 🎄 *¡Itsuki Nakano V3 está aquí para ayudarte!* 🎁`, m)
  }
}

function createCaption(title, author, duration, created_at = '') {
  return `🎄 *CONTENIDO NAVIDEÑO DE TIKTOK* 🎅

> 🏷 *Título:*
> \`\`\`${title || 'No disponible'}\`\`\`
> 👑 *Autor:*
\`\`\`${author?.nickname || author?.unique_id || 'No disponible'}\`\`\`
> ⏱️ *Duración:*
> \`\`\`${duration || 'No disponible'} segundos\`\`\`
${created_at ? `> 📆 *Subido:*\n\`\`\`${created_at}\`\`\`` : ''}

> 🎶 *Audio original de:* ${author?.nickname || author?.unique_id || 'No disponible'}

> 🎁 *¡Disfruta de tu contenido navideño!*
> 🎅 *Itsuki Nakano V3 te desea felices fiestas* 🎄`
}

function createSearchCaption(data) {
  return `🎄 *VIDEO NAVIDEÑO ENCONTRADO* 🎅

> 🏷 *Título:*
>\`\`\`${data.title || 'No disponible'}\`\`\`
> 👑 *Autor:*
> \`\`\`${data.author?.nickname || 'Desconocido'} ${data.author?.unique_id ? `@${data.author.unique_id}` : ''}\`\`\`
> ⏱️ *Duración:*
> \`\`\`${data.duration || 'No disponible'} segundos\`\`\`
> 🎶 *Música:*
> \`\`\`${data.music?.title || `Audio original - ${data.author?.unique_id || 'unknown'}`}\`\`\`

> 🎅 *¡Itsuki Nakano V3 encontró este video para ti!* 🎄`
}

handler.help = ['tiktok', 'tt', 'tiktokaudio', 'tta']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'tiktoks', 'tts', 'tiktokaudio', 'tta', 'ttaudio']
handler.group = true

export default handler