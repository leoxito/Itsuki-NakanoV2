// plugins/_welcome.js

let handler = async (m, { conn, participants }) => {
    // Este evento solo se activa cuando hay cambios en los participantes de un grupo
    if (m.type !== 'group-participants.update') return;

    // Obtenemos la configuración del grupo desde la base de datos
    let chat = global.db.data.chats[m.chat];

    // Si la función de bienvenida está desactivada en este grupo, no hacemos nada
    if (!chat.welcome) return;

    // Obtenemos los metadatos del grupo (nombre, descripción, participantes, etc.)
    let groupMetadata = await conn.groupMetadata(m.chat);
    let groupMembers = groupMetadata.participants;
    let groupName = groupMetadata.subject;

    // URL de las imágenes para bienvenida y despedida
    // ¡IMPORTANTE! Debes cambiar estas URLs por las tuyas.
    const welcomeImageUrl = 'https://i.imgur.com/eQ1M3VM.gif'; // URL para bienvenida
    const goodbyeImageUrl = 'https://i.imgur.com/VnLxMlU.gif';  // URL para despedida

    // Usamos un 'switch' para manejar las diferentes acciones (agregar o quitar)
    switch (m.action) {
        case 'add': {
            // Acción cuando uno o más usuarios se unen al grupo
            for (let user of m.participants) {
                // Obtenemos el nombre del usuario. Si no está en la DB, usa el de WhatsApp.
                let userName = global.db.data.users[user]?.name || conn.getName(user);
                
                // Obtenemos la posición del usuario en la lista de miembros del grupo
                let userPosition = groupMembers.findIndex(v => v.id === user) + 1;

                // Construimos el texto de bienvenida
                let welcomeText = `✨ *¡Bienvenido/a a ${groupName}!* ✨\n\n`;
                welcomeText += `👋 Hola, @${user.split('@')[0]}!\n`;
                welcomeText += `🎉 Nos alegra que te unas. Eres el/la miembro número *${userPosition}* en el grupo.\n`;
                welcomeText += `📜 Por favor, lee la descripción y respeta las normas.\n\n`;
                welcomeText += `*¡Disfruta tu estancia!* 🥳`;

                // Enviamos el mensaje con imagen y mención
                await conn.sendMessage(
                    m.chat,
                    {
                        image: { url: welcomeImageUrl },
                        caption: welcomeText,
                        mentions: [user] // <-- ¡CLAVE! Esto crea la mención @usuario
                    },
                    { quoted: m }
                );
            }
            break;
        }

        case 'remove': {
            // Acción cuando uno o más usuarios salen o son eliminados del grupo
            for (let user of m.participants) {
                let userName = global.db.data.users[user]?.name || conn.getName(user);
                
                // Obtenemos la posición que tenía el usuario (antes de que se actualice la lista)
                // Nota: La posición puede ser menos precisa aquí si se eliminan varios a la vez.
                let userPosition = groupMembers.findIndex(v => v.id === user) + 1;

                let goodbyeText = `👋 *¡Adiós, @${user.split('@')[0]}!* 👋\n\n`;
                goodbyeText += `📉 Has salido del grupo *${groupName}*. Eras el/la miembro número *${userPosition}*.\n`;
                goodbyeText += `🕊️ El grupo ahora tiene ${groupMembers.length} miembros.\n\n`;
                goodbyeText += `¡Te esperamos pronto!`;

                // Enviamos el mensaje de despedida
                await conn.sendMessage(
                    m.chat,
                    {
                        image: { url: goodbyeImageUrl },
                        caption: goodbyeText,
                        mentions: [user] // <-- ¡CLAVE! Mencionamos al usuario que se va
                    },
                    { quoted: m }
                );
            }
            break;
        }
    }
};

// Indicamos que este handler solo funciona en grupos
handler.group = true;

// No necesita un comando, se activa por un evento
export default handler;