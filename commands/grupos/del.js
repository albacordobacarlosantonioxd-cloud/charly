export default {
    name: "del",
    category: 'grupos',
    aliases: ["delete", "borrar"],
    // Extraemos todo lo necesario del objeto extra (quinto parámetro)
    run: async (sock, m, from, text, { isAdmin, isGroup, sender, isOwner }) => {
        
        // 1. Verificación de Grupo
        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });

        // 2. ¿Es admin del grupo O es el dueño del bot? 
        // (Nota: isOwner ya suele venir calculado en el index, pero si no, usamos tu lógica)
        if (!isAdmin && !isOwner) {
            return sock.sendMessage(from, { text: "❌ No tienes permisos. Debes ser admin del grupo para borrar mensajes." }, { quoted: m });
        }

        // 3. Obtener el mensaje citado usando m.quoted simplificado
        if (!m.quoted) {
            return sock.sendMessage(from, { text: "❌ Responde al mensaje que deseas eliminar." }, { quoted: m });
        }

        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        // 4. Estructura de la llave (key) para eliminar
        const key = {
            remoteJid: from,
            fromMe: m.quoted.sender === botId, // Si el mensaje citado es del bot
            id: m.quoted.id,
            participant: m.quoted.sender
        };

        try {
            // Intentamos borrar el mensaje
            await sock.sendMessage(from, { delete: key });
        } catch (err) {
            console.error("Error al borrar:", err);
            // Mensaje de error amigable
            await sock.sendMessage(from, { 
                text: "❌ No pude borrar el mensaje. Asegúrate de que soy admin del grupo para borrar mensajes de otros." 
            }, { quoted: m });
        }
    }
};
