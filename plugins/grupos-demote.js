const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return
  
  if (!isBotAdmin) {
    return conn.reply(m.chat, '> ⓘ \`Necesito ser admin\`', m)
  }
  
  if (!isAdmin) {
    return conn.reply(m.chat, '> ⓘ \`Solo admins pueden usar esto\`', m)
  }

  let targetUser = null
  
  // Buscar usuario mencionado
  if (m.mentionedJid && m.mentionedJid.length > 0) {
    targetUser = m.mentionedJid[0]
  } 
  // Buscar usuario del mensaje citado
  else if (m.quoted) {
    targetUser = m.quoted.sender
  }
  
  if (!targetUser) {
    return conn.reply(m.chat, '> ⓘ \`Menciona o responde a un usuario\`', m)
  }

  // Verificar que está en el grupo
  const userInGroup = participants.find(p => p.id === targetUser)
  if (!userInGroup) {
    return conn.reply(m.chat, '> ⓘ \`Usuario no está en el grupo\`', m)
  }

  // No quitar admin al creador
  if (userInGroup.admin === 'superadmin') {
    return conn.reply(m.chat, '> ⓘ \`No puedo quitar admin al creador\`', m)
  }

  // Verificar si es admin
  if (userInGroup.admin !== 'admin') {
    return conn.reply(m.chat, '> ⓘ \`El usuario no es admin\`', m)
  }

  await m.react('🕒')

  try {
    await conn.groupParticipantsUpdate(m.chat, [targetUser], 'demote')
    await m.react('✅')
    
    await conn.reply(m.chat, 
      `> ⓘ \`Admin removido:\` *@${targetUser.split('@')[0]}*`,
      m,
      { mentions: [targetUser] }
    )

  } catch (error) {
    await m.react('❌')
    await conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
  }
}

handler.help = ['demote']
handler.tags = ['group']
handler.command = /^(demote|quitaradmin)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler