export default {
    name: "open",
    category: 'grupos',
    // Extraemos isAdmin e isGroup del quinto parámetro (el objeto extra)
    run: async (sock, m, from, text, { isAdmin, isGroup }) => {
        
        // 1. Verificación de seguridad
        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });
        
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden abrir el grupo." }, { quoted: m });
        }

        try {
            // Cambiamos a 'not_announcement' para que todos puedan hablar
            await sock.groupSettingUpdate(from, "not_announcement");
            
            await sock.sendMessage(from, { 
                text: "🔓 *Grupo Abierto:* Ahora todos los participantes pueden enviar mensajes." 
            }, { quoted: m });

        } catch (e) {
            console.error("Error al abrir el grupo:", e);
            await sock.sendMessage(from, { 
                text: "❌ Hubo un error al intentar abrir el grupo. Asegúrate de que el bot sea administrador." 
            }, { quoted: m });
        }
    }
};
