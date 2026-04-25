export default {
    name: "del",
    category: 'grupos',
    aliases: ["delete"],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup, sender) => {
        // 1. Solo en grupos
        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });

        const normalizedSender = sender ? (sender.split(':')[0] + '@s.whatsapp.net') : '';
        // Aquí defines quién es el dueño del bot por si quiere borrar algo sin ser admin
        const isOwner = ["82906290606190@s.whatsapp.net"].includes(normalizedSender);

        // 2. ¿Es admin del grupo O es el dueño del bot?
        if (!isAdmin && !isOwner) {
            return sock.sendMessage(from, { text: "❌ No tienes permisos. Debes ser admin del grupo." }, { quoted: m });
        }

        // 3. Obtener el mensaje referenciado
        const quotedMsg = m.message.extendedTextMessage?.contextInfo;
        if (!quotedMsg?.stanzaId) {
            return sock.sendMessage(from, { text: "❌ Responde al mensaje que deseas eliminar." }, { quoted: m });
        }

        const msgSender = quotedMsg.participant || quotedMsg.remoteJid;
        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

        // 4. Estructura para borrar
        const key = {
            remoteJid: from,
            fromMe: msgSender === botId, // true si el bot borra su propio mensaje
            id: quotedMsg.stanzaId,
            participant: msgSender
        };

        try {
            // El bot intenta borrarlo directamente
            await sock.sendMessage(from, { delete: key });
        } catch (err) {
            console.error("Error al borrar:", err);
            // Si el bot no es admin en el WP, saltará este error
            await sock.sendMessage(from, { text: "❌ Error: Asegúrate de que el bot sea admin del grupo para borrar mensajes ajenos." }, { quoted: m });
        }
    }
};