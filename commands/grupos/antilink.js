const Group = require("../../index.js").Group;

module.exports = {
    name: "antilink",
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        if (!isGroup) {
            return sock.sendMessage(from, { text: "Este comando solo funciona en grupos." }, { quoted: m });
        }
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "Solo los administradores pueden configurar el Antilink." }, { quoted: m });
        }

        if (!text || (text !== "on" && text !== "off")) {
            return sock.sendMessage(from, { text: "⚠️ Usa: *.antilink on* o *.antilink off*" }, { quoted: m });
        }

        try {
            await Group.findOneAndUpdate({ id: from }, { antilink: text === "on" }, { upsert: true });
            await sock.sendMessage(from, { 
                text: `🛡️ *Antilink Actualizado:* Ahora está *${text === "on" ? "ACTIVADO ✅" : "DESACTIVADO ❌"}*` 
            }, { quoted: m });
        } catch (e) {
            console.error("Error al actualizar Antilink en MongoDB:", e);
            await sock.sendMessage(from, { text: "❌ Hubo un error al guardar la configuración del Antilink." }, { quoted: m });
        }
    }
};