export default {
    name: "demote",
    category: 'grupos',
    // Usamos {} para extraer lo que necesitamos del objeto extra
    run: async (sock, m, from, text, { isAdmin, isGroup }) => {
        
        // Verificaciones con los datos reales del paquete extra
        if (!isGroup) {
            return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });
        }
        
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden usar este comando." }, { quoted: m });
        }

        // Lógica simplificada para detectar al usuario (mencionando o citando)
        let user = m.quoted ? m.quoted.sender : (m.mentionedJid?.[0] || null);
        
        // Si no hay mención ni cita, intentamos por texto (número)
        if (!user && text) {
            user = text.replace(/\D/g, "") + "@s.whatsapp.net";
        }

        if (!user) {
            return sock.sendMessage(from, { text: "💡 Menciona a alguien, cita su mensaje o escribe su número para degradarlo." }, { quoted: m });
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
                text: "❌ Hubo un error. Asegúrate de que el bot sea administrador y que el usuario no sea el creador del grupo." 
            }, { quoted: m });
        }
    }
};
