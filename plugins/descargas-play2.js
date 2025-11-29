import ytSearch from 'yt-search'
import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `> ⓘ \`Uso:\` *${usedPrefix + command} nombre del video*`, m)

  try {
    await m.react('🕒')

    const search = await ytSearch(text)
    if (!search.videos.length) {
      await m.react('❌')
      return conn.reply(m.chat, '> ⓘ \`No se encontró ningún video\`', m)
    }

    const video = search.videos[0]

    // Mostrar información del video con imagen
    const info = `> ⓘ \`Título:\` *${video.title}*\n> ⓘ \`Autor:\` *${video.author.name}*\n> ⓘ \`Duración:\` *${video.timestamp}*\n> ⓘ \`Vistas:\` *${video.views.toLocaleString()}*`

    await conn.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption: info
    }, { quoted: m })

    if (command === 'play11') {
      // Descargar video - USANDO LA MISMA LÓGICA DE PLAY2
      try {
        const result = await fetch(`https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${video.url}&type=mp4`).then(r => r.json())
        if (!result?.data?.url) throw new Error('API sin resultado válido')

        // Descargar como buffer (igual que play2)
        const buffer = await fetch(result.data.url).then(res => res.buffer())

        await conn.sendMessage(m.chat, {
          video: buffer,
          mimetype: 'video/mp4',
          fileName: `${video.title}.mp4`,
          caption: `> ⓘ \`Video:\` *${video.title}*`
        }, { quoted: m })

        await m.react('✅')
      } catch (err) {
        await m.react('❌')
        // Intentar con otra API
        try {
          const altResult = await fetch(`https://api.nekolabs.fun/api/ytdl?url=${video.url}`).then(r => r.json())
          if (altResult?.videoUrl) {
            // Descargar como buffer (igual que play2)
            const buffer = await fetch(altResult.videoUrl).then(res => res.buffer())

            await conn.sendMessage(m.chat, {
              video: buffer,
              mimetype: 'video/mp4',
              fileName: `${video.title}.mp4`,
              caption: `> ⓘ \`Video:\` *${video.title}*`
            }, { quoted: m })
            await m.react('✅')
          } else {
            throw new Error('APIs fallaron')
          }
        } catch (e) {
          conn.reply(m.chat, '> ⓘ \`Error al descargar el video\`', m)
        }
      }

    } else {
      // Descargar audio - USANDO LA MISMA LÓGICA
      try {
        const apiURL = `https://api.nekolabs.web.id/downloader/youtube/v1?url=${video.url}&format=mp3`
        const result = await fetch(apiURL).then(r => r.json())

        let audioUrl
        if (result?.result?.downloadUrl) {
          audioUrl = result.result.downloadUrl
        } else {
          // Fallback
          const fallback = await fetch(`https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-335898e9-6d&url=${video.url}&type=mp3`).then(r => r.json())
          if (!fallback?.data?.url) throw new Error('No hay URL válida')
          audioUrl = fallback.data.url
        }

        // Descargar audio como buffer
        const buffer = await fetch(audioUrl).then(res => res.buffer())

        await conn.sendMessage(m.chat, {
          audio: buffer,
          mimetype: 'audio/mpeg',
          fileName: `${video.title}.mp3`,
          ptt: false
        }, { quoted: m })

        await m.react('✅')
      } catch (err) {
        await m.react('❌')
        conn.reply(m.chat, '> ⓘ \`Error al descargar el audio\`', m)
      }
    }

  } catch (error) {
    await m.react('❌')
    conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
  }
}

handler.help = ['play10', 'play11']
handler.tags = ['downloader']
handler.command = ['play10', 'play11']

export default handler