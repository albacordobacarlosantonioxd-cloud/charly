export default {
    name: "del",
    aliases: ["delete"],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup, sender) => {
        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const normalizedSender = sender ? (sender.split(':')[0] + '@s.whatsapp.net') : '';

        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id.split(':')[0] + '@s.whatsapp.net');
        
        const isBotAdmin = groupAdmins.includes(botId);
        const isOwner = ["82906290606190@s.whatsapp.net"].includes(normalizedSender); 

        const quotedMsg = m.message.extendedTextMessage?.contextInfo;
        if (!quotedMsg?.stanzaId) {
            return sock.sendMessage(from, { text: "❌ Responde al mensaje que quieres borrar." }, { quoted: m });
        }

        const msgSender = quotedMsg.participant;
        const normalizedMsgSender = msgSender ? (msgSender.split(':')[0] + '@s.whatsapp.net') : '';
        const isOwnMessage = normalizedMsgSender === normalizedSender;

        // Si no es su propio mensaje, requiere admin y bot admin
        if (!isOwnMessage) {
            if (!isAdmin && !isOwner) {
                return sock.sendMessage(from, { text: "❌ Solo los administradores pueden borrar mensajes de otros." }, { quoted: m });
            }
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: "❌ ¡Ocupo ser admin para borrar mensajes de otros, pariente!" }, { quoted: m });
            }
        }

        const key = {
            remoteJid: from,
            fromMe: msgSender === botId,
            id: quotedMsg.stanzaId,
            participant: msgSender
        };

        try {
            await sock.sendMessage(from, { delete: key });
        } catch (err) {
            console.error("Error al borrar mensaje:", err);
            await sock.sendMessage(from, { text: "❌ No pude borrar el mensaje. Revisa mis permisos." }, { quoted: m });
        }
    }
};