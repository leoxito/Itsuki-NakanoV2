import { promises as fs } from 'fs'

const charactersFilePath = './src/database/characters[1].json'
const haremFilePath = './src/database/harem.json'

const cooldowns = {}

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

let handler = async (m, { conn }) => {
    const userId = m.sender
    const now = Date.now()

    await m.react('⏳')

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000)
        const minutes = Math.floor(remainingTime / 60)
        const seconds = remainingTime % 60
        await conn.reply(m.chat, `> ⓘ \`Debes esperar:\` *${minutes} minutos y ${seconds} segundos*`, m)
        await m.react('❌')
        return
    }

    try {
        const characters = await loadCharacters()
        const harem = await loadHarem()

        const randomCharacter = characters[Math.floor(Math.random() * characters.length)]
        const randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)]

        const userHarem = harem.find(entry => entry.characterId === randomCharacter.id)
        const statusMessage = userHarem 
            ? '🔴 Ya reclamado' 
            : '🟢 Disponible'

        // FORMATO MEJORADO - ID más visible para el claim
        const message = `🎴 *${randomCharacter.name}*

> ⓘ \`Género:\` *${randomCharacter.gender}*
> ⓘ \`Valor:\` *${randomCharacter.value}*
> ⓘ \`Estado:\` *${statusMessage}*
> ⓘ \`Fuente:\` *${randomCharacter.source}*

🔖 *ID: ${randomCharacter.id}*`

        const mentions = userHarem ? [userHarem.userId] : []

        await conn.sendMessage(m.chat, {
            image: { url: randomImage },
            caption: message,
            mentions
        }, { quoted: m })

        await m.react('✅')

        cooldowns[userId] = now + 3 * 60 * 1000

    } catch (error) {
        await conn.reply(m.chat, `> ⓘ \`Error:\` *${error.message}*`, m)
        await m.react('❌')
    }
}

handler.help = ['rw']
handler.tags = ['gacha']
handler.command = ['rw', 'rollwaifu']
handler.group = true

export default handler