module.exports = {
    name: 'kick',
    aliases: ['sacar'],
    run: async (sock, m, from, text, quoted, args, isAdmin) => {
        if (!isAdmin) return;

        // 1. Identificamos a quién vamos a sacar (por mención o citando mensaje)
        const toKick = m.message.extendedTextMessage?.contextInfo?.participant || 
                       (text ? text.replace(/\D/g,'') + '@s.whatsapp.net' : null);

        if (!toKick) return sock.sendMessage(from, { text: '《✧》 Menciona a quién quieres darle cuello o responde a su mensaje.' });

        try {
            // Validar formato de JID
            if (!toKick.endsWith('@s.whatsapp.net')) {
                throw new Error('JID inválido');
            }

            // 2. EL MENSAJE DE DESPEDIDA (Antes de sacarlo)
            await sock.sendMessage(from, { 
                text: `@${toKick.split('@')[0]} Te saqué por puta. 👋🔥`, 
                mentions: [toKick] 
            });

            // 3. SE VA DEL GRUPO
            await sock.groupParticipantsUpdate(from, [toKick], "remove");
        } catch (error) {
            console.error('Error ejecutando kick:', error);
            sock.sendMessage(from, { text: `❌ Error al ejecutar kick: ${error.message}` });
        }
    }
};