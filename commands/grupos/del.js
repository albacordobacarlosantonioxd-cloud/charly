const mongoose = require("mongoose");
const User = mongoose.model("User");

module.exports = {
    name: "del",
    aliases: ["delete"],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        const sender = m.key.fromMe ? (sock.user.id.split(":")[0] + "@s.whatsapp.net") : (m.key.participant || from);

        const groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
        const participants = isGroup ? groupMetadata.participants : [];
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);
        
        const isBotAdmin = groupAdmins.includes(sock.user.id.split(":")[0] + "@s.whatsapp.net");
        const isOwner = ["82906290606190@s.whatsapp.net"].includes(sender); 

        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });
        if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: "❌ Solo los administradores pueden ejecutar este comando." }, { quoted: m });

        const quotedMsg = m.message.extendedTextMessage?.contextInfo;
        if (!quotedMsg?.stanzaId) return sock.sendMessage(from, { text: "❌ Responde al mensaje que quieres borrar." }, { quoted: m });

        const key = {
            remoteJid: from,
            fromMe: quotedMsg.participant === (sock.user.id.split(":")[0] + "@s.whatsapp.net"),
            id: quotedMsg.stanzaId,
            participant: quotedMsg.participant
        };

        try {
            await sock.sendMessage(from, { delete: key });
        } catch (err) {
            await sock.sendMessage(from, { text: "❌ No pude borrar el mensaje. Asegúrate de que yo (el bot) sea administrador, si no, WhatsApp no me deja." }, { quoted: m });
        }
    }
};