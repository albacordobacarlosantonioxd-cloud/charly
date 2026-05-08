export default {
    name: 'pfp',
    category: 'herramientas',
    run: async (sock, m, from) => {
        try {
            // 1. Obtener quién es el objetivo (citado, mención o el que escribe)
            let who;
            if (m.isGroup) {
                who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : m.sender;
            } else {
                who = m.quoted ? m.quoted.sender : m.sender;
            }

            // 2. Limpieza de JID ultra segura
            const targetJid = who.includes('@') ? who.split(':')[0] + '@s.whatsapp.net' : who;

            // Reacción de búsqueda
            await sock.sendMessage(from, { react: { text: '🔍', key: m.key } });

            let pp;
            try {
                // Intentamos obtener la foto HD
                pp = await sock.profilePictureUrl(targetJid, 'image');
            } catch (e) {
                // Si no tiene foto o hay error, foto por defecto
                pp = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
            }

            const number = targetJid.split('@')[0];

            // 3. Envío con mención y validación de URL
            await sock.sendMessage(from, { 
                image: { url: pp }, 
                caption: `✨ *Foto de Perfil de:* @${number}`,
                mentions: [targetJid]
            }, { quoted: m });

            // Reacción de éxito
            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            // Este log te dirá exactamente qué pasó en la terminal de tu HP o Railway
            console.error("❌ Error en comando PFP:", e);
        }
    }
};
