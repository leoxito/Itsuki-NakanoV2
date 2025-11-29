import yts from 'yt-search'    
import fetch from 'node-fetch'    

async function apiAdonix(url) {    
  const apiURL = `https://api-adonix.ultraplus.click/download/ytmp4?apikey=${global.apikey}&url=${encodeURIComponent(url)}`    
  const res = await fetch(apiURL)    
  const data = await res.json()    

  if (!data.status || !data.data?.url) throw new Error('API Adonix no devolvió datos válidos')    
  return { url: data.data.url, title: data.data.title || 'Video sin título', fuente: 'Adonix' }    
}    

async function apiMayAPI(url) {
  const apiURL = `https://mayapi.ooguy.com/ytdl?url=${encodeURIComponent(url)}&type=mp4&apikey=${global.APIKeys['https://mayapi.ooguy.com']}`
  const res = await fetch(apiURL)
  const data = await res.json()

  if (!data.status || !data.result?.url) throw new Error('API MayAPI no devolvió datos válidos')
  return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'MayAPI' }
}

async function ytdl(url) {    
  try {    
    return await apiAdonix(url)    
  } catch (e1) {    
    return await apiMayAPI(url)    
  }    
}    

let handler = async (m, { conn, text, usedPrefix }) => {    
  if (!text) {    
    return conn.reply(m.chat, 
`> ⓘ USO INCORRECTO

> ❌ Debes proporcionar el nombre del video

> 📝 Ejemplos:
> • ${usedPrefix}play2 nombre del video
> • ${usedPrefix}play2 artista canción`, m)    
  }    

  try {    
    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

    const searchResults = await yts(text)    
    if (!searchResults.videos.length) throw new Error('No se encontraron resultados')    

    const video = searchResults.videos[0]    
    const { url, title, fuente } = await ytdl(video.url)    

    const caption = `> *ⓘ Y O U T U B E - P L A Y V2*

> *🏷 ${title}*
> *⏱️ ${video.timestamp}*
> *👑 ${video.author.name}*
> *🎬 Formato: MP4*
> *🌐 Servidor: ${fuente}*`

    const buffer = await fetch(url).then(res => res.buffer())    

    await conn.sendMessage(    
      m.chat,    
      {    
        video: buffer,    
        mimetype: 'video/mp4',    
        fileName: `${title}.mp4`,    
        caption    
      },    
      { quoted: m }    
    )    

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {    
    console.error('Error en play2:', e)    
    await conn.reply(m.chat, 
`> ⓘ ERROR

> ❌ ${e.message}

> 💡 Verifica el nombre o intenta más tarde`, m)    
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
  }    
}    

handler.help = ['play2']    
handler.tags = ['downloader']    
handler.command = ['play2']
handler.group = true

export default handler