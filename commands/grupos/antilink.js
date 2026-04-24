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

        if (!text || (text.toLowerCase() !== "on" && text.toLowerCase() !== "off")) {
            return sock.sendMessage(from, { text: "⚠️ Usa: *.antilink on* o *.antilink off*" }, { quoted: m });
        }

        const antilinkStatus = text.toLowerCase() === "on";

        try {
            await Group.findOneAndUpdate({ id: from }, { antilink: antilinkStatus }, { upsert: true });
            await sock.sendMessage(from, { 
                text: `🛡️ *Antilink Actualizado:* Ahora está *${antilinkStatus ? "ACTIVADO ✅" : "DESACTIVADO ❌"}*` 
            }, { quoted: m });
        } catch (e) {
            console.error("Error al actualizar Antilink en MongoDB:", e);
            await sock.sendMessage(from, { text: "❌ Hubo un error al guardar la configuración del Antilink." }, { quoted: m });
        }
    },
    // Middleware para el antilink (checa cada mensaje)
    middleware: async (sock, m, from, isGroup) => {
        if (!isGroup) return;

        const Group = require("../../index.js").Group;
        const groupConfig = await Group.findOne({ id: from });

        if (groupConfig && groupConfig.antilink) {
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
            const isLink = /(https?:\/\/[^\s]+)/g.test(body);

            if (isLink) {
                // Verificar si el remitente es administrador
                const sender = m.key.fromMe ? (sock.user.id.split(":")[0] + "@s.whatsapp.net") : (m.key.participant || from);
                const groupMetadata = await sock.groupMetadata(from);
                const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin !== null;

                if (!isAdmin) {
                    await sock.sendMessage(from, { text: "🚫 *¡Enlace detectado!* Los links están prohibidos con Antilink activo." }, { quoted: m });
                    await sock.groupParticipantsUpdate(from, [sender], "remove"); // Sacar al que envió el link
                }
            }
        }
    }
};
