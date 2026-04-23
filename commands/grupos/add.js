module.exports = {
    name: "add",
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        if (!isGroup || !isAdmin) {
            return sock.sendMessage(from, { text: "Solo los administradores pueden añadir personas." }, { quoted: m });
        }

        let user = m.message.extendedTextMessage?.contextInfo?.participant || (text ? text.replace(/\D/g, ",") + "@s.whatsapp.net" : null);

        if (!user) {
            return sock.sendMessage(from, { text: "Menciona a alguien o escribe su número para añadirlo." }, { quoted: m });
        }

        const usersToAdd = user.split(",").map(jid => jid.trim().replace(/\D/g, "") + "@s.whatsapp.net");

        try {
            const response = await sock.groupParticipantsUpdate(from, usersToAdd, "add");
            const addedUsers = response.filter(r => r.status === "200").map(r => `@${r.jid.split("@")[0]}`).join(", ");
            const failedUsers = response.filter(r => r.status !== "200").map(r => `@${r.jid.split("@")[0]}`).join(", ");

            let replyMsg = "";
            if (addedUsers) {
                replyMsg += `✅ Añadidos: ${addedUsers}\n`;
            }
            if (failedUsers) {
                replyMsg += `❌ Fallaron: ${failedUsers} (Quizás ya estaban en el grupo o el link de invitación es necesario).`;
            }

            await sock.sendMessage(from, { text: replyMsg, mentions: usersToAdd }, { quoted: m });

        } catch (e) {
            console.error("Error al añadir participantes:", e);
            await sock.sendMessage(from, { text: "❌ Hubo un error al intentar añadir. Asegúrate de que el bot sea administrador." }, { quoted: m });
        }
    }
};
