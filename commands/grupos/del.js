export default {
    name: "del",
    category: 'grupos',
    aliases: ["delete", "borrar"],
    run: async (sock, m, from, text, { isAdmin, isGroup, isOwner }) => {
        
        // 1. Verificación de Grupo
        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });

        // 2. Solo Admin o Owner pueden ejecutarlo
        if (!isAdmin && !isOwner) {
            return sock.sendMessage(from, { text: "❌ No tienes permisos. Debes ser admin del grupo para borrar mensajes." }, { quoted: m });
        }

        // 3. Verificar que esté respondiendo a un mensaje
        if (!m.quoted) {
            return sock.sendMessage(from, { text: "❌ Responde al mensaje que deseas eliminar." }, { quoted: m });
        }

        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        // 4. Estructura para la eliminación
        const key = {
            remoteJid: from,
            fromMe: m.quoted.sender === botId, // true si el mensaje citado es del propio bot
            id: m.quoted.id,
            participant: m.quoted.sender
        };

        try {
            await sock.sendMessage(from, { delete: key });
        } catch (err) {
            console.error("Error al borrar:", err);
            // Si el bot no es admin en el grupo, este catch avisará
            await sock.sendMessage(from, { 
                text: "❌ Error: Asegúrate de que el bot sea admin para borrar mensajes de otros." 
            }, { quoted: m });
        }
    }
};
