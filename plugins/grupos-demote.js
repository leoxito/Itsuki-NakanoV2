async function makeFkontak() {
  try {
    const res = await fetch('https://i.postimg.cc/rFfVL8Ps/image.jpg')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Halo' },
      message: { locationMessage: { name: 'Demote', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return null
  }
}

const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin }) => {
  try {
    if (!m.isGroup) return

    // Verificar permisos primero
    if (!isBotAdmin) return
    if (!isAdmin) return

    // Obtener usuario target
    let targetUser = null
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      targetUser = m.mentionedJid[0]
    } else if (m.quoted) {
      targetUser = m.quoted.sender
    } else if (text) {
      // Buscar por número en el grupo
      const number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      if (participants.some(p => p.id === number)) {
        targetUser = number
      }
    }

    if (!targetUser) return

    // Verificar que el target está en el grupo
    const userInGroup = participants.find(p => p.id === targetUser)
    if (!userInGroup) return

    // No permitir quitar admin al creador
    if (userInGroup.admin === 'superadmin') return

    // Verificar si ya no es admin
    if (userInGroup.admin !== 'admin') return

    await m.react('🕑')

    try {
      // Quitar admin
      await conn.groupParticipantsUpdate(m.chat, [targetUser], 'demote')
      
      await m.react('✅')
      
      // Enviar confirmación
      const fkontak = await makeFkontak()
      await conn.reply(m.chat, 
        `> ⓘ \`Admin removido correctamente\`\n> ⓘ \`Usuario:\` *@${targetUser.split('@')[0]}*`, 
        fkontak || m, 
        { mentions: [targetUser] }
      )
      
    } catch (error) {
      await m.react('❌')
    }

  } catch (error) {
    await m.react('❌')
  }
}

handler.help = ['demote']
handler.tags = ['group']
handler.command = /^(demote)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler