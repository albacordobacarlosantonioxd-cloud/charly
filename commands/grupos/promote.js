export default {
    name: "promote",
    category: 'grupos',
    // Extraemos los permisos del objeto extra
    run: async (sock, m, from, text, { isAdmin, isGroup }) => {
        
        // 1. Verificaciones de seguridad
        if (!isGroup) {
            return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });
        }
        
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden promover a otros." }, { quoted: m });
        }

        // 2. Lógica para detectar al usuario (Cita o Mención)
        // Usamos m.quoted.sender gracias a la mejora que hicimos ayer
        let user = m.quoted ? m.quoted.sender : (m.mentionedJid?.[0] || null);
        
        // Si no hay cita ni mención, probamos con el número en el texto
        if (!user && text) {
            user = text.replace(/\D/g, "") + "@s.whatsapp.net";
        }

        if (!user) {
            return sock.sendMessage(from, { text: "💡 Menciona a alguien, cita su mensaje o escribe su número para darle admin." }, { quoted: m });
        }

        try {
            // Ejecutamos el ascenso en WhatsApp
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
