export default {
    name: "demote",
    category: 'grupos',
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        if (!isGroup) {
            return sock.sendMessage(from, { text: "Este comando solo funciona en grupos." }, { quoted: m });
        }
        
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "Solo los administradores pueden degradar a otros." }, { quoted: m });
        }

        let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message.extendedTextMessage?.contextInfo?.participant;
        
        if (!user && text) {
            user = text.replace(/\D/g, "") + "@s.whatsapp.net";
        }

        if (!user) {
            return sock.sendMessage(from, { text: "Menciona a alguien o escribe su número para degradarlo." }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(from, [user], "demote");
            
            await sock.sendMessage(from, { 
                text: `✅ @${user.split("@")[0]} ha sido degradado de administrador.`, 
                mentions: [user] 
            }, { quoted: m });
            
        } catch (e) {
            console.error("Error al degradar participante:", e);
            await sock.sendMessage(from, { 
                text: "❌ Hubo un error al intentar degradar. Asegúrate de que el bot sea administrador y que el usuario no sea el creador del grupo." 
            }, { quoted: m });
        }
    }
};