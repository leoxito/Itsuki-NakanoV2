import { smsg } from "./lib/simple.js" 
import { format } from "util"
import { fileURLToPath } from "url"
import path, { join } from "path"
import fs, { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import fetch from "node-fetch"
import ws from "ws"

const { proto } = (await import("@whiskeysockets/baileys")).default
const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

// === SISTEMA DE MULTI-PREFIJO MEJORADO ===
const globalPrefixes = [
  '.', ',', '!', '#', '$', '%', '&', '*',
  '-', '_', '+', '=', '|', '\\', '/', '~',
  '>', '<', '^', '?', ':', ';'
];

// Función para detectar prefijo con soporte para emojis
const detectPrefix = (text, customPrefix = null) => {
  if (!text || typeof text !== 'string') return null;
  
  // Primero verificar prefijos personalizados del chat
  if (customPrefix) {
    // Si es array (lista de prefijos del chat)
    if (Array.isArray(customPrefix)) {
      for (const prefix of customPrefix) {
        if (text.startsWith(prefix)) {
          return { 
            match: prefix, 
            prefix: prefix, 
            type: 'custom'
          };
        }
      }
    }
    // Si es string (prefijo específico del chat)
    else if (typeof customPrefix === 'string' && text.startsWith(customPrefix)) {
      return { 
        match: customPrefix, 
        prefix: customPrefix, 
        type: 'custom'
      };
    }
  }
  
  // Si no hay prefijo personalizado o no coincide, usar prefijos globales
  for (const prefix of globalPrefixes) {
    if (text.startsWith(prefix)) {
      return { 
        match: prefix, 
        prefix: prefix, 
        type: 'global'
      };
    }
  }
  
  return null;
};

// === DEFINICIÓN DE CÓDIGOS DE PAÍSES ===
const paisesCodigos = {
    'arabia': ['+966', '966'],
    'emiratos': ['+971', '971'],
    'qatar': ['+974', '974'],
    'kuwait': ['+965', '965'],
    'bahrein': ['+973', '973'],
    'oman': ['+968', '968'],
    'egipto': ['+20', '20'],
    'jordania': ['+962', '962'],
    'siria': ['+963', '963'],
    'irak': ['+964', '964'],
    'yemen': ['+967', '967'],
    'palestina': ['+970', '970'],
    'libano': ['+961', '961'],
    'india': ['+91', '91'],
    'pakistan': ['+92', '92'],
    'bangladesh': ['+880', '880'],
    'afganistan': ['+93', '93'],
    'nepal': ['+977', '977'],
    'sri-lanka': ['+94', '94'],
    'nigeria': ['+234', '234'],
    'ghana': ['+233', '233'],
    'kenia': ['+254', '254'],
    'etiopia': ['+251', '251'],
    'sudafrica': ['+27', '27'],
    'senegal': ['+221', '221'],
    'china': ['+86', '86'],
    'indonesia': ['+62', '62'],
    'filipinas': ['+63', '63'],
    'vietnam': ['+84', '84'],
    'tailandia': ['+66', '66'],
    'rusia': ['+7', '7'],
    'ucrania': ['+380', '380'],
    'rumania': ['+40', '40'],
    'polonia': ['+48', '48'],
    'mexico': ['+52', '52'],
    'brasil': ['+55', '55'],
    'argentina': ['+54', '54'],
    'colombia': ['+57', '57'],
    'peru': ['+51', '51'],
    'chile': ['+56', '56'],
    'venezuela': ['+58', '58']
}

// Función para detectar el país por número
function detectCountryByNumber(number) {
    const numStr = number.toString()
    for (const [country, codes] of Object.entries(paisesCodigos)) {
        for (const code of codes) {
            if (numStr.startsWith(code.replace('+', ''))) {
                return country
            }
        }
    }
    return 'local'
}

// Función para obtener nombre completo del país
function getCountryName(code) {
    const countryNames = {
        'arabia': 'Arabia Saudita 🇸🇦',
        'emiratos': 'Emiratos Árabes 🇦🇪',
        'qatar': 'Qatar 🇶🇦',
        'kuwait': 'Kuwait 🇰🇼',
        'bahrein': 'Bahréin 🇧🇭',
        'oman': 'Omán 🇴🇲',
        'egipto': 'Egipto 🇪🇬',
        'jordania': 'Jordania 🇯🇴',
        'siria': 'Siria 🇸🇾',
        'irak': 'Irak 🇮🇶',
        'yemen': 'Yemen 🇾🇪',
        'palestina': 'Palestina 🇵🇸',
        'libano': 'Líbano 🇱🇧',
        'india': 'India 🇮🇳',
        'pakistan': 'Pakistán 🇵🇰',
        'bangladesh': 'Bangladesh 🇧🇩',
        'afganistan': 'Afganistán 🇦🇫',
        'nepal': 'Nepal 🇳🇵',
        'sri-lanka': 'Sri Lanka 🇱🇰',
        'nigeria': 'Nigeria 🇳🇬',
        'ghana': 'Ghana 🇬🇭',
        'kenia': 'Kenia 🇰🇪',
        'etiopia': 'Etiopía 🇪🇹',
        'sudafrica': 'Sudáfrica 🇿🇦',
        'senegal': 'Senegal 🇸🇳',
        'china': 'China 🇨🇳',
        'indonesia': 'Indonesia 🇮🇩',
        'filipinas': 'Filipinas 🇵🇭',
        'vietnam': 'Vietnam 🇻🇳',
        'tailandia': 'Tailandia 🇹🇭',
        'rusia': 'Rusia 🇷🇺',
        'ucrania': 'Ucrania 🇺🇦',
        'rumania': 'Rumania 🇷🇴',
        'polonia': 'Polonia 🇵🇱',
        'mexico': 'México 🇲🇽',
        'brasil': 'Brasil 🇧🇷',
        'argentina': 'Argentina 🇦🇷',
        'colombia': 'Colombia 🇨🇴',
        'peru': 'Perú 🇵🇪',
        'chile': 'Chile 🇨🇱',
        'venezuela': 'Venezuela 🇻🇪'
    }
    return countryNames[code] || code
}

// Función para verificar si un usuario es admin
async function isUserAdmin(conn, groupJid, userJid) {
    try {
        const metadata = await conn.groupMetadata(groupJid)
        const participant = metadata.participants.find(p => p.id === userJid)
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin')
    } catch (error) {
        return false
    }
}

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()

    if (!chatUpdate) {
        return
    }

    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]

    if (!m) {
        return
    }

    if (global.db.data == null) await global.loadDatabase()

    try {
        m = smsg(this, m) || m
        if (!m) {
            return
        }
        m.exp = 0

        try {
            const user = global.db.data.users[m.sender]
            if (typeof user !== "object") global.db.data.users[m.sender] = {}
            if (user) {
                // SISTEMA DE REGISTRO - INICIO
                if (!("registered" in user)) user.registered = false
                if (!user.registered) {
                    if (!("name" in user)) user.name = m.name
                    if (!isNumber(user.age)) user.age = -1
                    if (!isNumber(user.regTime)) user.regTime = -1
                }
                // SISTEMA DE REGISTRO - FIN

                if (!("exp" in user) || !isNumber(user.exp)) user.exp = 0
                if (!("coin" in user) || !isNumber(user.coin)) user.coin = 0
                if (!("bank" in user) || !isNumber(user.bank)) user.bank = 0
                if (!("level" in user) || !isNumber(user.level)) user.level = 0
                if (!("health" in user) || !isNumber(user.health)) user.health = 100
                if (!("genre" in user)) user.genre = ""
                if (!("birth" in user)) user.birth = ""
                if (!("marry" in user)) user.marry = ""
                if (!("description" in user)) user.description = ""
                if (!("packstickers" in user)) user.packstickers = null
                if (!("premium" in user)) user.premium = false
                if (!("premiumTime" in user)) user.premiumTime = 0
                if (!("banned" in user)) user.banned = false
                if (!("bannedReason" in user)) user.bannedReason = ""
                if (!("commands" in user) || !isNumber(user.commands)) user.commands = 0
                if (!("afk" in user) || !isNumber(user.afk)) user.afk = -1
                if (!("afkReason" in user)) user.afkReason = ""
                if (!("warn" in user) || !isNumber(user.warn)) user.warn = 0
            } else global.db.data.users[m.sender] = {
                registered: false,
                name: m.name,
                age: -1,
                regTime: -1,
                exp: 0,
                coin: 0,
                bank: 0,
                level: 0,
                health: 100,
                genre: "",
                birth: "",
                marry: "",
                description: "",
                packstickers: null,
                premium: false,
                premiumTime: 0,
                banned: false,
                bannedReason: "",
                commands: 0,
                afk: -1,
                afkReason: "",
                warn: 0
            }

            const chat = global.db.data.chats[m.chat]
            if (typeof chat !== "object") global.db.data.chats[m.chat] = {}
            if (chat) {
                if (!("isBanned" in chat)) chat.isBanned = false
                if (!("isMute" in chat)) chat.isMute = false;
                if (!("welcome" in chat)) chat.welcome = true
                if (!("sWelcome" in chat)) chat.sWelcome = ""
                if (!("sBye" in chat)) chat.sBye = ""
                if (!("welcomeImage" in chat)) chat.welcomeImage = ""
                if (!("byeImage" in chat)) chat.byeImage = ""
                if (!("detect" in chat)) chat.detect = true
                if (!("primaryBot" in chat)) chat.primaryBot = null
                if (!("modoadmin" in chat)) chat.modoadmin = false
                if (!("antiLink" in chat)) chat.antiLink = true
                if (!("antiArabe" in chat)) chat.antiArabe = true
                if (!("antiExtranjero" in chat)) chat.antiExtranjero = false
                if (!("paisesBloqueados" in chat)) chat.paisesBloqueados = []
                if (!("nsfw" in chat)) chat.nsfw = false
                if (!("economy" in chat)) chat.economy = true;
                if (!("gacha" in chat)) chat.gacha = true
                if (!("rootowner" in chat)) chat.rootowner = false
                if (!("adminmode" in chat)) chat.adminmode = false
                // === NUEVO: SISTEMA DE PREFIJOS POR CHAT ===
                if (!("prefix" in chat)) chat.prefix = null
                if (!("prefixes" in chat)) chat.prefixes = []
            } else global.db.data.chats[m.chat] = {
                isBanned: false,
                isMute: false,
                welcome: true,
                sWelcome: "",
                sBye: "",
                welcomeImage: "",
                byeImage: "",
                detect: true,
                primaryBot: null,
                modoadmin: false,
                antiLink: true,
                antiArabe: true,
                antiExtranjero: false,
                paisesBloqueados: [],
                nsfw: false,
                economy: true,
                gacha: true,
                rootowner: false,
                adminmode: false,
                prefix: null,
                prefixes: []
            }

            const settings = global.db.data.settings[this.user.jid]
            if (typeof settings !== "object") global.db.data.settings[this.user.jid] = {}
            if (settings) {
                if (!("self" in settings)) settings.self = false
                if (!("jadibotmd" in settings)) settings.jadibotmd = true
            } else global.db.data.settings[this.user.jid] = {
                self: false,
                jadibotmd: true
            }
        } catch (e) {
            console.error(e)
        }

        if (typeof m.text !== "string") m.text = ""

        const user = global.db.data.users[m.sender]
        try {
            const actual = user.name || ""
            const nuevo = m.pushName || await this.getName(m.sender)
            if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) {
                user.name = nuevo
            }
        } catch {}

        const chat = global.db.data.chats[m.chat]
        const settings = global.db.data.settings[this.user.jid]  

        // CORRECCIÓN DEL ERROR - Manejar arrays dentro de arrays en global.owner
        const isROwner = [...global.owner].map(v => {
            if (Array.isArray(v)) {
                return v[0] ? v[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null
            } else {
                return v ? v.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null
            }
        }).filter(Boolean).includes(m.sender)

        const isOwner = isROwner || m.fromMe

        // OBTENER INFORMACIÓN DE ADMINISTRADORES DEL GRUPO - CORREGIDO: usar this en lugar de conn
        const groupMetadata = m.isGroup ? { 
            ...(this.chats?.[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}), 
            ...(((this.chats?.[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}).participants) && { 
                participants: ((this.chats?.[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}).participants || []).map(p => ({ 
                    ...p, 
                    id: p.jid, 
                    jid: p.jid, 
                    lid: p.lid 
                })) 
            }) 
        } : {}

        const participants = ((m.isGroup ? groupMetadata.participants : []) || []).map(participant => ({ 
            id: participant.jid, 
            jid: participant.jid, 
            lid: participant.lid, 
            admin: participant.admin 
        }))

        // CORREGIDO: usar this.decodeJid en lugar de conn.decodeJid
        const userGroup = (m.isGroup ? participants.find((u) => this.decodeJid(u.jid) === m.sender) : {}) || {}
        const botGroup = (m.isGroup ? participants.find((u) => this.decodeJid(u.jid) == this.user.jid) : {}) || {}

        const isRAdmin = userGroup?.admin == "superadmin" || false
        const isAdmin = isRAdmin || userGroup?.admin == "admin" || false
        const isBotAdmin = botGroup?.admin || false

        // === SISTEMA ROOTOWNER - VERIFICACIÓN ===
        if (chat?.rootowner && !isROwner) {
            return
        }

        // === SISTEMA ADMIN MODE - VERIFICACIÓN ===
        if (chat?.adminmode && !isAdmin && !isROwner) {
            return
        }

        const isPrems = isROwner || [...global.prems].map(v => {
            if (Array.isArray(v)) {
                return v[0] ? v[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null
            } else {
                return v ? v.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null
            }
        }).filter(Boolean).includes(m.sender) || user.premium == true

        const isOwners = [this.user.jid, ...global.owner.map(v => Array.isArray(v) ? v[0] : v).filter(Boolean).map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")].includes(m.sender)

        if (opts["queque"] && m.text && !(isPrems)) {
            const queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(m.id || m.key.id)
            setInterval(async function () {
                if (queque.indexOf(previousID) === -1) clearInterval(this)
                await delay(time)
            }, time)
        }

        if (m.isBaileys) return

        m.exp += Math.ceil(Math.random() * 10)

        // === SISTEMA ANTI-ARABE - DENTRO DEL HANDLER ===
        try {
            if (m.message && m.key.remoteJid.endsWith('@g.us')) {
                const text = m.text || ''
                const sender = m.sender

                // Sistema AntiArabe - EXPULSA números árabes
                if (chat.antiArabe) {
                    const userNumber = sender.split('@')[0]
                    const paisesArabes = [
                        '+966', '966', // Arabia Saudita
                        '+971', '971', // Emiratos Árabes Unidos
                        '+974', '974', // Qatar
                        '+965', '965', // Kuwait
                        '+973', '973', // Bahréin
                        '+968', '968', // Omán
                        '+20', '20',   // Egipto
                        '+962', '962', // Jordania
                        '+963', '963', // Siria
                        '+964', '964', // Irak
                        '+967', '967', // Yemen
                        '+970', '970', // Palestina
                        '+961', '961', // Líbano
                        '+218', '218', // Libia
                        '+212', '212', // Marruecos
                        '+216', '216', // Túnez
                        '+213', '213', // Argelia
                        '+222', '222', // Mauritania
                        '+253', '253', // Yibuti
                        '+252', '252', // Somalia
                        '+249', '249'  // Sudán
                    ]

                    const esArabe = paisesArabes.some(code => userNumber.startsWith(code.replace('+', '')))

                    if (esArabe) {
                        const isAdmin = await isUserAdmin(this, m.chat, sender)
                        if (!isAdmin) {
                            // Expulsar al usuario árabe
                            await this.groupParticipantsUpdate(m.chat, [sender], 'remove')

                            await this.sendMessage(m.chat, { 
                                text: `╭─「 🚫 *ANTI-ARABE ACTIVADO* 🚫 」
│ 
│ *ⓘ Usuario árabe detectado y expulsado*
│ 
│ 📋 *Información:*
│ ├ Usuario: *Arabe*
│ ├ País: Número árabe detectado
│ ├ Razón: Anti-Arabe activado
│ ├ Acción: Expulsado del grupo
│ └ Mensaje: Eliminado
│ 
│ 🌍 *Países bloqueados:*
│ ├ Arabia Saudita, Emiratos, Qatar
│ ├ Kuwait, Bahréin, Omán, Egipto
│ ├ Jordania, Siria, Irak, Yemen
│ ├ Palestina, Líbano y +10 más
│ 
│ 💡 *Para desactivar:*
│ └ Use el comando .antiarabe off
╰─◉`.trim(),
                                mentions: [sender]
                            })
                            return
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error en sistema anti-arabe:', error)
        }

        let usedPrefix

        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")

        for (const name in global.plugins) {
            const plugin = global.plugins[name]
            if (!plugin) continue
            if (plugin.disabled) continue

            const __filename = join(___dirname, name)

            if (typeof plugin.all === "function") {
                try {
                    await plugin.all.call(this, m, {
                        chatUpdate,
                        __dirname: ___dirname,
                        __filename,
                        user,
                        chat,
                        settings
                    })
                } catch (err) {
                    console.error(err)
                }
            }

            if (!opts["restrict"])
            if (plugin.tags && plugin.tags.includes("admin")) {
                continue
            }

            // === SISTEMA DE MULTI-PREFIJO ===
            // Obtener prefijos para este chat
            const chatPrefixes = chat?.prefixes || []
            const chatPrefix = chat?.prefix || null
            
            // Crear lista combinada de prefijos: primero los del chat, luego los globales
            let allPrefixes = []
            if (chatPrefixes.length > 0) {
                allPrefixes = [...chatPrefixes]
            }
            
            // Si el chat tiene un prefijo específico, agregarlo primero
            if (chatPrefix) {
                allPrefixes = [chatPrefix, ...allPrefixes]
            }
            
            // Agregar prefijos globales
            allPrefixes = [...allPrefixes, ...globalPrefixes]
            
            // Remover duplicados
            allPrefixes = [...new Set(allPrefixes)]
            
            // Detectar prefijo
            const prefixMatch = detectPrefix(m.text, allPrefixes)

            if (typeof plugin.before === "function") {
                if (await plugin.before.call(this, m, {
                    match: prefixMatch ? [prefixMatch.prefix] : [],
                    prefixMatch,
                    conn: this,
                    participants,
                    groupMetadata,
                    userGroup,
                    botGroup,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename,
                    user,
                    chat,
                    settings
                })) {
                    continue
                }
            }

            if (typeof plugin !== "function") {
                continue
            }

            if (prefixMatch && (usedPrefix = prefixMatch.prefix)) {
                const noPrefix = m.text.replace(usedPrefix, "")
                let [command, ...args] = noPrefix.trim().split(" ").filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split(" ").slice(1)
                let text = _args.join(" ")
                command = (command || "").toLowerCase()
                const fail = plugin.fail || global.dfail
                const isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => cmd instanceof RegExp ?
                        cmd.test(command) : cmd === command) :
                    typeof plugin.command === "string" ?
                    plugin.command === command : false

                global.comando = command

                if (!isOwners && settings.self) return

                if ((m.id.startsWith("NJX-") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return

                // SISTEMA PRIMARY BOT
                if (global.db.data.chats[m.chat].primaryBot && global.db.data.chats[m.chat].primaryBot !== this.user.jid) {
                    const primaryBotConn = global.conns.find(conn => conn.user.jid === global.db.data.chats[m.chat].primaryBot && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED)
                    const participants = m.isGroup ? (await this.groupMetadata(m.chat).catch(() => ({ participants: [] }))).participants : []
                    const primaryBotInGroup = participants.some(p => p.jid === global.db.data.chats[m.chat].primaryBot)

                    if (primaryBotConn && primaryBotInGroup || global.db.data.chats[m.chat].primaryBot === global.conn.user.jid) {
                        throw !1
                    } else {
                        global.db.data.chats[m.chat].primaryBot = null
                    }
                }

                if (!isAccept) continue

                m.plugin = name
                if (isAccept) { global.db.data.users[m.sender].commands = (global.db.data.users[m.sender].commands || 0) + 1 }

                if (chat) {
                    const botId = this.user.jid
                    const primaryBotId = chat.primaryBot

                    if (name !== "group-banchat.js" && chat?.isBanned && !isROwner) {
                        if (!primaryBotId || primaryBotId === botId) {
                            const aviso = `El bot *${global.botname}* está desactivado en este grupo\n\n> ✦ Un *administrador* puede activarlo con el comando:\n> » *${usedPrefix}bot on*`.trim()
                            await m.reply(aviso)
                            return
                        }
                    }

                    if (m.text && user.banned && !isROwner) {
                        const mensaje = `Estas baneado/a, no puedes usar comandos en este bot!\n\n> ● *Razón ›* ${user.bannedReason}\n\n> ● Si este Bot es cuenta oficial y tienes evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`.trim()
                        if (!primaryBotId || primaryBotId === botId) {
                            m.reply(mensaje)
                            return
                        }
                    }
                }

                if (!isOwners && !m.chat.endsWith('g.us') && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return

                const adminMode = chat.modoadmin || false
                const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || pluginPrefix || m.text.slice(0, 1) === pluginPrefix || plugin.command

                if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return

                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                    fail("owner", m, this, usedPrefix)
                    continue
                }

                if (plugin.rowner && !isROwner) {
                    fail("rowner", m, this, usedPrefix)
                    continue
                }

                if (plugin.owner && !isOwner) {
                    fail("owner", m, this, usedPrefix)
                    continue
                }

                if (plugin.premium && !isPrems) {
                    fail("premium", m, this, usedPrefix)
                    continue
                }

                // SISTEMA DE REGISTRO - VALIDACIÓN
                if (plugin.register == true && user.registered == false) {
                    fail("unreg", m, this, usedPrefix)
                    continue
                }

                if (plugin.group && !m.isGroup) {
                    fail("group", m, this, usedPrefix)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) {
                    fail("botAdmin", m, this, usedPrefix)
                    continue
                } else if (plugin.admin && !isAdmin) {
                    fail("admin", m, this, usedPrefix)
                    continue
                }

                if (plugin.private && m.isGroup) {
                    fail("private", m, this, usedPrefix)
                    continue
                }

                m.isCommand = true
                m.exp += plugin.exp ? parseInt(plugin.exp) : 10

                let extra = {
                    match: [usedPrefix],
                    prefixMatch,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    userGroup,
                    botGroup,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename,
                    user,
                    chat,
                    settings
                }

                try {
                    await plugin.call(this, m, extra)
                } catch (err) {
                    m.error = err
                    console.error(err)
                } finally {
                    if (typeof plugin.after === "function") {
                        try {
                            await plugin.after.call(this, m, extra)
                        } catch (err) {
                            console.error(err)
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error(err)
    } finally {
        if (opts["queque"] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
            this.msgqueque.splice(quequeIndex, 1)
        }

        let user, stats = global.db.data.stats
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
            }
        }

        try {
            if (!opts["noprint"]) await (await import("./lib/print.js")).default(m, this)
        } catch (err) {
            console.warn(err)
            console.log(m.message)
        }
    }
}

global.dfail = (type, m, conn, usedPrefix = '.') => {
    let user2 = m.pushName || 'Anónimo'

    const msg = {
        rowner: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ ᥣ᥆ ⍴ᥙᥱძᥱ ᥙ𝗍іᥣіzᥲr ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`',
        owner: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ⍴᥆r ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`',
        mods: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ⍴᥆r ᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`',
        premium: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙ𝗍іᥣіzᥲr ⍴᥆r ᥙsᥙᥲrі᥆s ⍴rᥱmіᥙm, ᥡ ⍴ᥲrᥲ mі ᥴrᥱᥲძ᥆r.`',
        group: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ᥱᥒ grᥙ⍴᥆s.`',
        private: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ sᥱ ⍴ᥙᥱძᥱ ᥙsᥲr ᥲᥴ һᥲ𝗍 ⍴rі᥎ᥲძ᥆ ძᥱᥣ ᑲ᥆𝗍.`',
        admin: '> `ⓘ ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ s᥆ᥣ᥆ ᥱs ⍴ᥲrᥲ ᥲძmіᥒs ძᥱᥣ grᥙ⍴᥆.`',
        botAdmin: '> `ⓘ ⍴ᥲrᥲ ⍴᥆ძᥱr ᥙsᥲr ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆ ᥱs ᥒᥱᥴᥱsᥲrі᥆ 𝗊ᥙᥱ ᥡ᥆ sᥱᥲ ᥲძmіᥒ.`',
        unreg: `> \`ⓘ ᥒᥱᥴᥱsі𝗍ᥲs ᥱs𝗍ᥲr rᥱgіs𝗍rᥲძ᥆(ᥲ) ⍴ᥲrᥲ ᥙsᥲr ᥱs𝗍ᥱ ᥴ᥆mᥲᥒძ᥆, ᥱsᥴrіᑲ᥆ #rᥱg ⍴ᥲrᥲ rᥱgіs𝗍rᥲr𝗍ᥱ.\``,
        restrict: '> `ⓘ ᥴ᥆mᥲᥒძ᥆ rᥱs𝗍rіᥒgіძ᥆ ⍴᥆r ძᥱᥴіsі᥆ᥒ ძᥱᥣ ⍴r᥆⍴іᥱ𝗍ᥲrі᥆ ძᥱᥣ ᑲ᥆𝗍.`'
    }[type];

    if (msg) return conn.reply(m.chat, msg, m, global.rcanal).then(_ => m.react('❌️'))
}

// CORRECCIÓN: Cambiar global.__filename por fileURLToPath
let file = fileURLToPath(import.meta.url)
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.magenta("Se actualizó 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})

// Exportar funciones del sistema de prefijos
global.detectPrefix = detectPrefix
global.globalPrefixes = globalPrefixes

export default { 
    handler
}