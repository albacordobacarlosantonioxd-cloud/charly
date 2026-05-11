export default {
    name: "close",
    category: 'grupos',
    // Usamos la destructuración para recibir isAdmin e isGroup del quinto parámetro
    run: async (sock, m, from, text, { isAdmin, isGroup }) => {
        
        // 1. Verificación de seguridad
        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });
        
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden cerrar el grupo." }, { quoted: m });
        }

        try {
            // Actualizamos la configuración a 'announcement' (solo admins)
            await sock.groupSettingUpdate(from, "announcement");
            
            await sock.sendMessage(from, { 
                text: "🔒 *Grupo Cerrado:* Ahora solo los administradores pueden enviar mensajes." 
            }, { quoted: m });

        } catch (e) {
            console.error("Error al cerrar el grupo:", e);
            await sock.sendMessage(from, { 
                text: "❌ Hubo un error al intentar cerrar el grupo. Asegúrate de que el bot sea administrador." 
            }, { quoted: m });
        }
    }
};
