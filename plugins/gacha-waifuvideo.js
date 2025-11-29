import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters[1].json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('> ⓘ \`No se pudo cargar el archivo characters.json\`')
    }
}

let handler = async (m, { conn, command, args, usedPrefix }) => {
    if (args.length === 0) {
        return conn.reply(m.chat, `> ⓘ \`Uso:\` *${usedPrefix}${command} nombre del personaje*`, m)
    }

    const characterName = args.join(' ').toLowerCase().trim()

    try {
        const characters = await loadCharacters()
        const character = characters.find(c => c.name.toLowerCase() === characterName)

        if (!character) {
            return conn.reply(m.chat, `> ⓘ \`No se encontró el personaje:\` *${characterName}*`, m)
        }

        if (!character.vid || character.vid.length === 0) {
            return conn.reply(m.chat, `> ⓘ \`No hay videos disponibles para:\` *${character.name}*`, m)
        }

        const randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)]
        const message = `> ⓘ \`Video de:\` *${character.name}*`

        await conn.sendMessage(m.chat, { 
            video: { url: randomVideo }, 
            caption: message
        }, { quoted: m })
    } catch (error) {
        await conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
    }
}

handler.help = ['wvideo']
handler.tags = ['gacha']
handler.command = ['wvideo']
handler.group = true
export default handler