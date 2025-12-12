let handler = async (m, { conn }) => {
    if (m.type !== 'group-participants.update') return;

    let chat = global.db.data.chats[m.chat];

    if (!chat.welcome) return;

    let groupMetadata;
    try {
        groupMetadata = await conn.groupMetadata(m.chat);
    } catch (e) {
        return;
    }

    const groupName = groupMetadata.subject;
    const currentMembersLength = groupMetadata.participants.length;

    const welcomeImageUrl = 'https://cdn.russellxz.click/6ae2181d.jpg';
    const goodbyeImageUrl = 'https://cdn.russellxz.click/9f98f272.jpg';

    for (let user of m.participants) {
        const mentionId = user.split('@')[0];
        let userName = global.db.data.users[user]?.name || conn.getName(user);
        const mentionsList = [user]; 

        switch (m.action) {
            case 'add': {
                let welcomeText = `✨ *¡Bienvenido/a a ${groupName}!* ✨\n\n`;
                welcomeText += `👋 Hola, @${mentionId}!\n`;
                welcomeText += `🎉 Ahora somos *${currentMembersLength}* miembros.\n`;
                welcomeText += `📜 Por favor, lee la descripción y respeta las normas.\n\n`;
                welcomeText += `*¡Disfruta tu estancia!* 🥳`;

                await conn.sendMessage(
                    m.chat,
                    {
                        image: { url: welcomeImageUrl },
                        caption: welcomeText,
                        mentions: mentionsList
                    },
                    { quoted: m }
                );
                break;
            }

            case 'remove': {
                let goodbyeText = `👋 *¡Adiós, @${mentionId}!* 👋\n\n`;
                goodbyeText += `📉 El grupo *${groupName}* pierde a un miembro.\n`;
                goodbyeText += `🕊️ Ahora somos *${currentMembersLength}* miembros.\n\n`;
                goodbyeText += `¡Esperamos verte pronto!`;

                await conn.sendMessage(
                    m.chat,
                    {
                        image: { url: goodbyeImageUrl },
                        caption: goodbyeText,
                        mentions: mentionsList
                    },
                    { quoted: m }
                );
                break;
            }
        }
    }
};

handler.group = true;

export default handler;
