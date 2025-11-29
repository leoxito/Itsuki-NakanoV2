import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters[1].json'
const haremFilePath = './src/database/harem.json'

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('> ⓘ \`No se pudo cargar el archivo characters.json\`')
    }
}

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        return []
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        const characters = await loadCharacters()
        const harem = await loadHarem()
        let userId

        if (m.quoted && m.quoted.sender) {
            userId = m.quoted.sender
        } else if (args[0] && args[0].startsWith('@')) {
            userId = args[0].replace('@', '') + '@s.whatsapp.net'
        } else {
            userId = m.sender
        }

        const userCharacters = characters.filter(character => character.user === userId)

        if (userCharacters.length === 0) {
            return conn.reply(m.chat, 
                `> ⓘ \`${userId === m.sender ? 'No tienes' : '@' + userId.split('@')[0] + ' no tiene'} personajes reclamados\``,
                m, 
                { mentions: [userId] }
            )
        }

        const page = parseInt(args[1]) || 1
        const charactersPerPage = 50
        const totalCharacters = userCharacters.length
        const totalPages = Math.ceil(totalCharacters / charactersPerPage)
        const startIndex = (page - 1) * charactersPerPage
        const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters)

        if (page < 1 || page > totalPages) {
            return conn.reply(m.chat, 
                `> ⓘ \`Página no válida\`\n> ⓘ \`Páginas disponibles:\` *1 - ${totalPages}*`,
                m
            )
        }

        let message = `> ⓘ \`Usuario:\` *@${userId.split('@')[0]}*\n> ⓘ \`Total de personajes:\` *${totalCharacters}*\n> ⓘ \`Página:\` *${page}/${totalPages}*\n\n`

        for (let i = startIndex; i < endIndex; i++) {
            const character = userCharacters[i]
            message += `${i + 1}. *${character.name}* - ${character.value}\n`
        }

        if (page < totalPages) {
            message += `\n> ⓘ \`Usa:\` *${usedPrefix}${command} ${page + 1} para ver más*`
        }

        await conn.reply(m.chat, message, m, { mentions: [userId] })
    } catch (error) {
        await conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
    }
}

handler.help = ['harem']
handler.tags = ['gacha']
handler.command = ['harem']
handler.group = true

export default handler