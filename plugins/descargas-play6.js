import fetch from 'node-fetch'
import yts from 'yt-search'
const { generateWAMessageContent, generateWAMessageFromContent, proto } = (await import('@whiskeysockets/baileys')).default

const APPLE_SEARCH_ENDPOINT = 'https://itunes.apple.com/search'
const APPLE_MAX_RESULTS = 10

async function makeFkontak() {
  try {
    const res = await fetch('https://i.postimg.cc/x8dk1hcW/1000-F-575425197-qu-Jgp-NKn-FYHI8IVt8Hy-GTGb-J8lj-Owvp-H-(1).png')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { locationMessage: { name: 'Mix Music', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return undefined
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const quotedContact = await makeFkontak()
  if (!text) return conn.reply(m.chat, '> *`🌱 Ingresa el nombre o enlace de YouTube/Spotify`*', quotedContact || m)
  await m.react('🕓')
  try {
    async function createImage(url) {
      const { imageMessage } = await generateWAMessageContent({ image: { url } }, { upload: conn.waUploadToServer })
      return imageMessage
    }

    let songSections = []
    let youtubeSections = []
    let appleSections = []
    let headImage = null
    let firstYoutube = null

    try {
      const y = await yts(text)
      if (y?.videos?.length) {
        const vids = y.videos.slice(0, 12)
        firstYoutube = vids[0]
        headImage = firstYoutube?.thumbnail ? await createImage(firstYoutube.thumbnail) : null
        vids.forEach((v, i) => {
          const sectionTitle = `Resultado ${i + 1} — ${v.title}`
          const desc = `${v.author?.name || v.author} | ${v.timestamp} | ${v.ago} | ${Number(v.views).toLocaleString()} vistas`
          youtubeSections.push({
            title: sectionTitle,
            rows: [
              { header: '𝗔 𝗨 𝗗 𝗜 𝗢', title: sectionTitle, description: desc, id: `${usedPrefix}ytmp3 ${v.url}` },
              { header: '𝗩 𝗜 𝗗 𝗘 𝗢', title: sectionTitle, description: desc, id: `${usedPrefix}ytmp4 ${v.url}` }
            ]
          })
        })
      }
    } catch {}

    try {
      let api = await fetch(`https://delirius-apiofc.vercel.app/search/spotify?q=${encodeURIComponent(text)}`)
      let json = await api.json()
      if (json?.data?.length) {
        let items = json.data.slice(0, 12)
        items.forEach((track, i) => {
          const sectionTitle = `Resultado ${i + 1} — ${track.title}`
          const desc = `Artistas: ${track.artist} | Duración: ${track.duration} | Popularidad: ${track.popularity} | Fecha: ${track.publish}`
          if (track.url) {
            songSections.push({
              title: sectionTitle,
              rows: [
                { header: 'S P O T I F Y', title: sectionTitle, description: desc, id: `${usedPrefix}song ${track.url}` }
              ]
            })
          }
        })
        if (!headImage && items[0]?.image) headImage = await createImage(items[0].image)
      }
    } catch {}

    try {
      const params = new URLSearchParams({
        term: text,
        limit: String(APPLE_MAX_RESULTS),
        media: 'music',
        entity: 'song',
        country: 'us'
      })
      const res = await fetch(`${APPLE_SEARCH_ENDPOINT}?${params.toString()}`)
      const data = await res.json()
      const results = Array.isArray(data?.results) ? data.results.slice(0, APPLE_MAX_RESULTS) : []
      results.forEach((track, i) => {
        const title = track.trackName || track.collectionName || 'Sin título'
        const artist = track.artistName || 'Desconocido'
        const album = track.collectionName || 'N/A'
        const duration = track.trackTimeMillis ? `${Math.round(track.trackTimeMillis / 60000)} min` : '—'
        const sectionTitle = `Resultado ${i + 1} — ${title}`
        const desc = `Artista: ${artist} | Álbum: ${album} | Duración: ${duration}`
        if (track.trackViewUrl) {
          appleSections.push({
            title: sectionTitle,
            rows: [
              {
                header: 'APPLE MUSIC',
                title: sectionTitle,
                description: desc,
                id: `${usedPrefix}appledl --url ${track.trackViewUrl}`
              }
            ]
          })
        }
      })
    } catch {}

    if (!firstYoutube && !songSections.length && !appleSections.length) {
      return conn.reply(m.chat, '*`❌ No se encontraron resultados en YouTube, Apple Music ni Song Downloader`*', quotedContact || m)
    }

    let title = firstYoutube?.title || 'Resultado'
    let ago = firstYoutube?.ago || '-'
    let timestamp = firstYoutube?.timestamp || '-'
    let views = firstYoutube?.views || 0
    let details = `> 🏷️ *\`TÍTULO:\`* ${title}\n> 📆 *\`SUBIDO:\`* ${ago}\n> 🕛 *\`DURACIÓN:\`* ${timestamp}\n> 👀 *\`VISTAS:\`* ${Number(views).toLocaleString()}`

    let bodyText = details

    let quickButtons = []
    if (firstYoutube) {
      quickButtons = [
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎧  ꛁ𐑼 ʏᴏᴛᴜʙᴇ ᴘʟᴀʏ-ᴀᴜᴅɪᴏ', id: `${usedPrefix}ytmp3 ${firstYoutube.url}` }) },
        { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎬  ꛁ𐑼 ʏᴏᴜᴛᴜʙᴇ ᴘʟᴀʏ-ᴠɪᴅᴇᴏ', id: `${usedPrefix}ytmp4 ${firstYoutube.url}` }) },
      ]
    }

    const buttons = [
      ...quickButtons,
      ...(youtubeSections.length
        ? [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: 'ׁ  ׅ  ׁ  ׅ  🫧^ֹ᪲᪲  ׁ  ׅ ʏᴏᴜᴛᴜʙᴇ ʟɪsᴛ',
              sections: youtubeSections
            })
          }]
        : []),
      ...(songSections.length
        ? [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: '  ׅ  ׁ  ׅ  🎧^ֹ᪲᪲  ׁ  ׅ sᴘᴏᴛɪғʏ ʟɪsᴛ',
              sections: songSections
            })
          }]
        : []),
      ...(appleSections.length
        ? [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: '  ׅ  ׁ  ׅ  🍎^ֹ᪲᪲  ׁ  ׅ ᴀᴘᴘʟᴇ ᴍᴜsɪᴄ ʟɪsᴛ',
              sections: appleSections
            })
          }]
        : [])
    ]

    const combinedMessage = {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            ...(headImage
              ? {
                  header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: '',
                    subtitle: '',
                    hasMediaAttachment: true,
                    imageMessage: headImage
                  })
                }
              : {}),
            body: proto.Message.InteractiveMessage.Body.fromObject({ text: bodyText }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({ buttons })
          })
        }
      }
    }

    await conn.relayMessage(m.chat, combinedMessage, { messageId: m.id?.id || m.key.id })
    await m.react('✅')
  } catch (error) {
    conn.reply(m.chat, `*\\\`❌ Error: ${error?.message || error}\\\`*`, quotedContact || m)
    await m.react('❌')
  }
}

handler.help = ['play10' , 'play11']
handler.tags = ['downloader']
handler.command = ['play10', 'play11']

export default handler