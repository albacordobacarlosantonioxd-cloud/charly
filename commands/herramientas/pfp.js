function getNumber(jid = '') {
    return String(jid || '').split(':')[0].split('@')[0]
}

export default {
    command: ['pfp', 'profilepic', 'pp'],
    help: ['pfp @user', 'pfp <quoted>'],
    description: 'Obtiene la foto de perfil de un usuario.',
    category: 'tools',
    async run({ sock, m }) {
        try {
            // Validamos que 'm' exista para evitar el error de undefined
            if (!m) return;

            // Blindamos la búsqueda del target
            const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quotedSender = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.remoteJid;
            
            // Prioridad: 1. Mención, 2. Citado, 3. Tú mismo
            const target = mentions[0] || m.quoted?.sender || quotedSender || m.sender;

            const pp = await sock.profilePictureUrl(target, 'image').catch(_ => null);
            
            if (!pp) {
                return await sock.sendMessage(m.chat, {
                    text: `❌ No pude obtener la foto de perfil de @${getNumber(target)}. Puede que sea privada o no tenga.`,
                    mentions: [target]
                }, { quoted: m });
            }

            return await sock.sendMessage(m.chat, {
                image: { url: pp },
                caption: `🏮 Foto de perfil de @${getNumber(target)}`,
                mentions: [target]
            }, { quoted: m });

        } catch (error) {
            console.error("Error detallado en PFP:", error);
            // Si todo falla, al menos que no se crashee el bot
            if (m && m.chat) {
                await sock.sendMessage(m.chat, { text: '⚠️ Ocurrió un error inesperado al buscar la foto.' }, { quoted: m });
            }
        }
    }
}
