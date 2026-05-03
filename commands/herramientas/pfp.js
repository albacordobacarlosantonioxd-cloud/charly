import { resolveLidToRealJid } from "../core/utils.js";

export default {
    name: 'pfp',
    category: 'herramientas',
    run: async (sock, m, from) => {
        try {
            // 1. Extraer ID con triple validación
            let who = m.quoted?.sender || (m.mentionedJid && m.mentionedJid[0]) || m.sender;

            // 2. Si por alguna razón 'who' sigue siendo undefined, usamos el remitente actual
            if (!who) who = m.sender;

            // 3. Limpieza para evitar conflictos en Zorin OS
            const cleanId = String(who).split(':')[0] + '@s.whatsapp.net';

            await sock.sendMessage(from, { react: { text: '🔍', key: m.key } });

            // 4. Resolver JID (con la nueva función blindada ya no habrá error de toString)
            const targetJid = await resolveLidToRealJid(cleanId, sock, from) || cleanId;

            let pp;
            try {
                pp = await sock.profilePictureUrl(targetJid, 'image');
            } catch {
                pp = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
            }

            const number = targetJid.split('@')[0];
            await sock.sendMessage(from, { 
                image: { url: pp }, 
                caption: `✨ *Foto de Perfil de:* @${number}`,
                mentions: [targetJid]
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("❌ Error controlado en PFP:", e.message);
        }
    }
};
