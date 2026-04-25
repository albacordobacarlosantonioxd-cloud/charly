export default {
    name: "close",
    category: 'grupos',
    run: async (sock, m, from, text, quoted, args, isAdmin) => {
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "Solo los administradores pueden cerrar el grupo." }, { quoted: m });
        }

        try {
            await sock.groupSettingUpdate(from, "announcement");
        } catch (e) {
            console.error("Error al cerrar el grupo:", e);
            await sock.sendMessage(from, { text: "❌ Hubo un error al intentar cerrar el grupo. Asegúrate de que el bot sea administrador." }, { quoted: m });
        }
    }
};