let handler = async (m, { conn }) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: '🕑', key: m.key } })

    // Tiempo inicial ANTES de enviar mensaje
    const start = Date.now()

    // Enviar un mensaje de prueba para medir ping
        await conn.sendMessage(m.chat, { react: { text: '⚡️', key: m.key } })

    // Tiempo final DESPUÉS de enviar mensaje
    const end = Date.now()

    // Calcular ping  (tiempo de envío del mensaje)
    const ping = end - start

    // Evaluación del ping
    let speed, status;
    if (ping < 100) {
      speed = '🚀 Extremadamente Rápido'
      status = '🟢 Excelente'
    } else if (ping < 300) {
      speed = '⚡ Muy Rápido'
      status = '🟡 Óptimo'
    } else if (ping < 600) {
      speed = '🏓 Rápido'
      status = '🟡 Bueno'
    } else if (ping < 1000) {
      speed = '📶 Normal'
      status = '🟠 Estable'
    } else {
      speed = '🐢 Lento'
      status = '🔴 Regular'
    }

    // Obtener uptime del bot
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`

    // Mensaje del ping
    const pingMessage = `> *ⓘ I T S U K I - P I N G* 

> \`*Ping :\*` ${ping} ms
> \`*Velocidad :\*` ${speed}
> \`*Estado :\*` ${status}
> \`*Uptime :\*` ${uptimeString}`

    // Enviar resultado
    await conn.reply(m.chat, pingMessage, m)
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (error) {
    console.error('Error en ping:', error)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.reply(m.chat, 
      `> ⓘ ERROR

\`Error :\` No se pudo calcular el ping`, m)
  }
}

handler.help = ['ping']
handler.tags = ['main']
handler.command = ['p', 'ping']

export default handler