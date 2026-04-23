module.exports = {
    name: "open",
    run: async (sock, m, from, text, quoted, args, isAdmin) => {
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "Solo los administradores pueden abrir el grupo." }, { quoted: m });
        }

        try {
            await sock.groupSettingUpdate(from, "not_announcement");
            await sock.sendMessage(from, { text: "✅ Grupo Abierto: Ahora todos pueden enviar mensajes." }, { quoted: m });
        } catch (e) {
            console.error("Error al abrir el grupo:", e);
            await sock.sendMessage(from, { text: "❌ Hubo un error al intentar abrir el grupo. Asegúrate de que el bot sea administrador." }, { quoted: m });
        }
    }
};