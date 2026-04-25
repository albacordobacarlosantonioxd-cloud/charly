export default {
    name: "promote",
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        if (!isGroup) {
            return sock.sendMessage(from, { text: "Este comando solo funciona en grupos." }, { quoted: m });
        }
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "Solo los administradores pueden promover a otros." }, { quoted: m });
        }

        let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message.extendedTextMessage?.contextInfo?.participant;
        
        if (!user && text) {
            user = text.replace(/\D/g, "") + "@s.whatsapp.net";
        }

        if (!user) {
            return sock.sendMessage(from, { text: "Menciona a alguien o escribe su número para promoverlo." }, { quoted: m });
        }

        try {
            await sock.groupParticipantsUpdate(from, [user], "promote");

            await sock.sendMessage(from, { 
                text: `✅ @${user.split("@")[0]} ha sido promovido a administrador.`, 
                mentions: [user] 
            }, { quoted: m });
            
        } catch (e) {
            console.error("Error al promover participante:", e);
            await sock.sendMessage(from, { 
                text: "❌ Hubo un error al intentar promover. Asegúrate de que el bot sea administrador." 
            }, { quoted: m });
        }
    }
};