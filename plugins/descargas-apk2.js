import { search, download } from 'aptoide-scraper'
import fetch from 'node-fetch'
import Jimp from 'jimp'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return conn.reply(m.chat, `> 🎄 *¡NAVIDAD EN APK!* 🎅

> 🎁 *DESCARGADOR APK NAVIDEÑO*

> ❌ *Uso incorrecto*

\`\`\`Debes ingresar el nombre de la aplicación\`\`\`

> *Ejemplos navideños:*
> • ${usedPrefix + command} WhatsApp
> • ${usedPrefix + command} TikTok

> 🎅 *Nota:* Busca y descarga APKs desde Aptoide`, m)
  }

  try {
    await m.react('🎁')

    let searchA = await search(text)
    if (!searchA.length) {
      await m.react('❌')
      return conn.reply(m.chat, `> 🎄 *¡BÚSQUEDA SIN RESULTADOS!* 🎅

> 🔍 *Búsqueda sin resultados*

\`\`\`No se encontraron aplicaciones para: ${text}\`\`\`

> *Sugerencias:*
> • Verifica la ortografía
> • Intenta con el nombre exacto
> • Usa términos en inglés

> 🎅 *¡Itsuki V3 te ayuda a buscar mejor!* 🎄`, m)
    }

    let data5 = await download(searchA[0].id)

    let txt = `> 🎄 *¡INFORMACIÓN DE LA APK!* 🎅

> 📱 *Nombre:*
\`\`\`${data5.name}\`\`\`

> 📦 *Package:*
\`\`\`${data5.package}\`\`\`

> 📅 *Última actualización:*
\`\`\`${data5.lastup}\`\`\`

> 💾 *Tamaño:*
\`\`\`${data5.size}\`\`\`

> 📥 *Estado:*
\`\`\`Preparando descarga navideña...\`\`\`

> 🎅 *¡Itsuki Nakano V3 - Tu asistente navideño!* 🎄`

    await conn.sendFile(m.chat, data5.icon, 'thumbnail.jpg', txt, m)

    if (data5.size.includes('GB') || parseFloat(data5.size.replace(' MB', '')) > 999) {
      await m.react('❌')
      return conn.reply(m.chat, `> 🎄 *¡ARCHIVO DEMASIADO GRANDE!* 🎅

> ⚠️ *Límite de tamaño excedido*

\`\`\`El archivo pesa: ${data5.size}\`\`\`

> 📏 *Límite máximo permitido:*
\`\`\`999 MB\`\`\`

> *Solución:*
> • Busca una versión más ligera
> • Descarga desde otro sitio
> • Verifica el tamaño antes de descargar

> 🎅 *¡Itsuki V3 recomienda buscar alternativas!* 🎄`, m)
    }

    let thumbnail = null
    try {
      const img = await Jimp.read(data5.icon)
      img.resize(300, Jimp.AUTO)
      thumbnail = await img.getBufferAsync(Jimp.MIME_JPEG)
    } catch (err) {
      console.log('🎄 Error al crear miniatura:', err)
    }

    await conn.sendMessage(
      m.chat,
      {
        document: { url: data5.dllink },
        mimetype: 'application/vnd.android.package-archive',
        fileName: `${data5.name}_navidad.apk`,
        caption: `> 🎄 *¡APK DESCARGADA!* 🎅

> 📱 *Aplicación:*
\`\`\`${data5.name}\`\`\`

> 📦 *Package:*
\`\`\`${data5.package}\`\`\`

> 💾 *Tamaño:*
\`\`\`${data5.size}\`\`\`

> 🎅 *¡Disfruta tu aplicación navideña!*
> 🎄 *¡Feliz Navidad con Itsuki Nakano V3!* 🎁`,
        ...(thumbnail ? { jpegThumbnail: thumbnail } : {})
      },
      { quoted: m }
    )

    await m.react('✅')

  } catch (error) {
    console.error(error)
    await m.react('❌')
    return conn.reply(m.chat, `> 🎄 *¡ERROR EN DESCARGA!* 🎅

> ❌ *Error detectado*

\`\`\`${error.message || 'Error al procesar la descarga'}\`\`\`

> *Posibles causas:*
> • Aplicación no disponible
> • Problemas con Aptoide
> • Error en la conexión

> *Solución:*
> • Verifica el nombre de la aplicación
> • Intenta con otro término de búsqueda
> • Prueba más tarde

> 🎅 *¡Itsuki V3 lo intentará de nuevo!* 🎄`, m)
  }
}

handler.tags = ['downloader']
handler.help = ['modoapk']
handler.command = ['modapk', 'apk2']
handler.group = true
// handler.premium = false

export default handler