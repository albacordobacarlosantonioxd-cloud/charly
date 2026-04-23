module.exports = {
    name: "tag",
    run: async (sock, m, from, text, quoted, args, isAdmin) => {
        if (!isAdmin) return;
        
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants.map(p => p.id);
        
        const content = text || (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                                 m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text);

        if (!content) return sock.sendMessage(from, { text: "《✧》 Escribe algo o responde a un mensaje para taggear a todos." });

        await sock.sendMessage(from, { 
            text: content, 
            mentions: participants 
        });
    }
};