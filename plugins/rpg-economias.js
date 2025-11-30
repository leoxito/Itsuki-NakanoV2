const currency = 'Coins';

// Inicializar base de datos si no existe
if (!global.db) global.db = { data: { users: {}, chats: {} } };
if (!global.db.data) global.db.data = { users: {}, chats: {} };
if (!global.db.data.users) global.db.data.users = {};
if (!global.db.data.chats) global.db.data.chats = {};

function formatTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const txt = [];
  if (h > 0) txt.push(`${h} hora${h !== 1 ? 's' : ''}`);
  if (m > 0 || h > 0) txt.push(`${m} minuto${m !== 1 ? 's' : ''}`);
  txt.push(`${s} segundo${s !== 1 ? 's' : ''}`);
  return txt.join(' ');
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const cofres = [
  "> \`🌸 Has encontrado un cofre antiguo decorado con flores de cerezo.\`",
  "> \`🎀 Descubriste un cofre mágico de Itsuki Nakano lleno de tesoros.\`",
  "> \`📚 Te topaste con un cofre de estudio con monedas para libros.\`",
  "> \`🍱 Encontraste un cofre de bento especial con recompensas.\`",
  "> \`✨ Un cofre brillante apareció con regalos de Itsuki.\`"
];

// ==================== HANDLER PRINCIPAL ====================
let handler = async (m, { conn, args, usedPrefix, command, isAdmin }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})
  const ctxOk = (global.rcanalr || {})

  try {
    // Verificar si es grupo
    if (!m.isGroup) {
      await m.react('❌')
      return conn.reply(m.chat, '> \`🚫 Este comando solo funciona en grupos.\`', m, ctxErr);
    }

    // COMANDO ECONOMY
    if (command === 'economy' || command === 'economia') {
      if (!isAdmin) {
        await m.react('⚠️')
        return conn.reply(m.chat, '> \`⚠️ Necesitas ser administrador.\`', m, ctxErr);
      }

      // Inicializar chat si no existe
      if (!global.db.data.chats[m.chat]) {
        global.db.data.chats[m.chat] = { economy: true };
      }

      const action = args[0]?.toLowerCase();
      const currentStatus = global.db.data.chats[m.chat].economy;

      if (!action) {
        const estado = currentStatus ? '🟢 ACTIVADO' : '🔴 DESACTIVADO';
        await m.react('📊')
        return conn.reply(m.chat, 
          `> \`📊 Estado del Sistema Económico\`\n\n` +
          `> \`🔧 Comando:\` ${usedPrefix}economy <on/off>\n` +
          `> \`📊 Estado actual:\` ${estado}\n\n` +
          `> \`💡 Activa o desactiva los comandos de economía en este grupo.\``,
          m, ctxWarn
        );
      }

      if (action === 'on' || action === 'activar') {
        if (currentStatus) {
          await m.react('ℹ️')
          return conn.reply(m.chat, '> \`ℹ️ El sistema económico ya está activado.\`', m, ctxWarn);
        }
        global.db.data.chats[m.chat].economy = true;
        await m.react('✅')
        return conn.reply(m.chat, 
          '> \`✅ Sistema Económico Activado\`\n\n' +
          '> \`📚 "¡Ahora pueden disfrutar del sistema económico en este grupo!"\` 🍙',
          m, ctxOk
        );
      }

      if (action === 'off' || action === 'desactivar') {
        if (!currentStatus) {
          await m.react('ℹ️')
          return conn.reply(m.chat, '> \`ℹ️ El sistema económico ya está desactivado.\`', m, ctxWarn);
        }
        global.db.data.chats[m.chat].economy = false;
        await m.react('❌')
        return conn.reply(m.chat, 
          '> \`❌ Sistema Económico Desactivado\`\n\n' +
          '> \`📚 "He desactivado el sistema económico en este grupo."\` 🍙',
          m, ctxWarn
        );
      }

      await m.react('❌')
      return conn.reply(m.chat, '> \`❌ Opción no válida. Usa: on u off\`', m, ctxErr);
    }

    // VERIFICAR SI LA ECONOMÍA ESTÁ ACTIVA PARA OTROS COMANDOS
    if (!global.db.data.chats[m.chat]?.economy) {
      await m.react('🚫')
      return conn.reply(m.chat, 
        `> \`🚫 Sistema Económico Desactivado\`\n\n` +
        `> \`📚 Un administrador puede activarlo con:\`\n` +
        `> \`» ${usedPrefix}economy on\``,
        m, ctxErr
      );
    }

    // COMANDO BALANCE
    if (command === 'balance' || command === 'bal' || command === 'dinero') {
      let target = m.sender;

      // Verificar si mencionaron a alguien
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
      } else if (m.quoted) {
        target = m.quoted.sender;
      }

      // Inicializar usuario si no existe
      if (!global.db.data.users[target]) {
        global.db.data.users[target] = {
          coin: 1000, // Dinero inicial
          bank: 0,
          exp: 0,
          lastDaily: 0,
          lastcofre: 0,
          streak: 0
        };
      }

      const user = global.db.data.users[target];
      const coin = user.coin || 0;
      const bank = user.bank || 0;
      const total = coin + bank;

      let name = 'Usuario';
      try {
        name = await conn.getName(target);
      } catch {
        name = target.split('@')[0];
      }

      await m.react('💰')
      const texto = 
        `> \`📊 BALANCE DE ${name.toUpperCase()}\` 🍙\n\n` +
        `> \`💼 Cartera:\` *¥${coin.toLocaleString()}* ${currency}\n` +
        `> \`🏦 Banco:\` *¥${bank.toLocaleString()}* ${currency}\n` +
        `> \`💰 Total:\` *¥${total.toLocaleString()}* ${currency}\n\n` +
        `> \`📚 "¡Sigue esforzándote!"\` ✨`;

      await conn.reply(m.chat, texto, m, ctxOk);
    }

    // COMANDO DAILY
    if (command === 'daily' || command === 'diario') {
      const user = global.db.data.users[m.sender] || {
        coin: 1000,
        bank: 0,
        exp: 0,
        lastDaily: 0,
        streak: 0
      };

      const now = Date.now();
      const gap = 86400000; // 24 horas

      if (user.lastDaily && now < user.lastDaily + gap) {
        const waitTime = formatTime(Math.floor((user.lastDaily + gap - now) / 1000));
        await m.react('⏳')
        return conn.reply(m.chat, 
          `> \`⏰ Espera un poco más\`\n\n` +
          `> \`📚 Vuelve en:\` *${waitTime}*\n` +
          `> \`🍙 "La paciencia es una virtud"\` ✨`,
          m, ctxWarn
        );
      }

      // Calcular recompensa
      const baseReward = 5000;
      const streakBonus = (user.streak || 0) * 500;
      const reward = baseReward + streakBonus;
      const expGain = 50;

      // Actualizar usuario
      user.coin = (user.coin || 1000) + reward;
      user.exp = (user.exp || 0) + expGain;
      user.streak = (user.streak || 0) + 1;
      user.lastDaily = now;

      // Guardar en la base de datos
      global.db.data.users[m.sender] = user;

      await m.react('🎉')
      await conn.reply(m.chat,
        `> \`🎉 RECOMPENSA DIARIA\` 🍙\n\n` +
        `> \`💰 Monedas:\` *¥${reward.toLocaleString()}* ${currency}\n` +
        `> \`⭐ Experiencia:\` *+${expGain} EXP*\n` +
        `> \`📅 Racha:\` *Día ${user.streak}*\n\n` +
        `> \`📚 "¡Excelente trabajo hoy!"\` ✨`,
        m, ctxOk
      );
    }

    // COMANDO COFRE
    if (command === 'cofre' || command === 'coffer') {
      const user = global.db.data.users[m.sender] || {
        coin: 1000,
        bank: 0,
        exp: 0,
        lastcofre: 0
      };

      const now = Date.now();
      const gap = 86400000; // 24 horas

      if (user.lastcofre && now < user.lastcofre + gap) {
        const waitTime = formatTime(Math.floor((user.lastcofre + gap - now) / 1000));
        await m.react('⏳')
        return conn.reply(m.chat,
          `> \`⏰ Cofre en enfriamiento\`\n\n` +
          `> \`📚 Vuelve en:\` *${waitTime}*\n` +
          `> \`🍙 "Los tesoros necesitan tiempo para regenerarse"\` ✨`,
          m, ctxWarn
        );
      }

      const reward = Math.floor(Math.random() * 3000) + 2000;
      const expGain = Math.floor(Math.random() * 30) + 20;

      user.coin = (user.coin || 1000) + reward;
      user.exp = (user.exp || 0) + expGain;
      user.lastcofre = now;

      global.db.data.users[m.sender] = user;

      await m.react('🎁')
      await conn.reply(m.chat,
        `> \`🎁 ¡COFRE ENCONTRADO!\` 🍙\n\n` +
        `${pickRandom(cofres)}\n\n` +
        `> \`💰 Recompensa:\` *¥${reward.toLocaleString()}* ${currency}\n` +
        `> \`⭐ Experiencia:\` *+${expGain} EXP*\n\n` +
        `> \`📚 "¡Buen trabajo!"\` ✨`,
        m, ctxOk
      );
    }

    // COMANDO BALTOP
    if (command === 'baltop' || command === 'top') {
      const users = Object.entries(global.db.data.users)
        .map(([jid, data]) => ({
          jid,
          coin: data.coin || 0,
          bank: data.bank || 0,
          total: (data.coin || 0) + (data.bank || 0)
        }))
        .filter(user => user.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      if (users.length === 0) {
        await m.react('📊')
        return conn.reply(m.chat,
          `> \`📊 TOP RICOS\` 🍙\n\n` +
          `> \`📝 Aún no hay usuarios con dinero.\`\n` +
          `> \`💡 Usa ${usedPrefix}daily para empezar\``,
          m, ctxWarn
        );
      }

      await m.react('🏆')
      let text = `> \`🏆 TOP 10 - USUARIOS MÁS RICOS\` 🍙\n\n`;

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        let name = 'Usuario';
        try {
          name = await conn.getName(user.jid);
        } catch {
          name = user.jid.split('@')[0];
        }

        text += `> \`${i + 1}. 🎯 ${name}\`\n`;
        text += `> \`   💰 Total:\` *¥${user.total.toLocaleString()}* ${currency}\n\n`;
      }

      await conn.reply(m.chat, text, m, ctxOk);
    }

  } catch (error) {
    console.error('Error en economía:', error);
    await m.react('❌')
    conn.reply(m.chat, '> \`❌ Ocurrió un error. Intenta nuevamente.\`', m, ctxErr);
  }
};

// Configuración del handler
handler.help = [
  'economy',
  'balance', 
  'daily',
  'cofre',
  'baltop'
];

handler.tags = ['economy'];
handler.command = [
  'economy', 'economia',
  'balance', 'bal', 'dinero', 
  'daily', 'diario',
  'cofre', 'coffer',
  'baltop', 'top'
];
handler.group = true;

export default handler;