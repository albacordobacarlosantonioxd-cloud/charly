const axios = require('axios');

module.exports = {
    name: 'kiss',
    aliases: ['hug', 'slap'],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup, sender) => {
        const command = args[0] || m.text.slice(1).split(' ')[0].toLowerCase();
        let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        let quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
        const objetivo = mentioned || quotedParticipant;

        if (!objetivo) {
            return sock.sendMessage(from, { text: `⚠️ ¡Epa! Etiqueta a alguien o responde a su mensaje para usar .${command}, pariente.` }, { quoted: m });
        }

        try {
            const response = await axios.get(`https://api.waifu.pics/sfw/${command}`);
            const gifUrl = response.data.url;
            const targetName = objetivo.split('@')[0];
            const selfName = sender.split('@')[0];
            
            let frase = '';
            if (command === 'kiss') frase = `👩‍❤️‍💋‍👨 @${selfName} le dio un beso a @${targetName}`;
            if (command === 'hug') frase = `🫂 @${selfName} abrazó a @${targetName}`;
            if (command === 'slap') frase = `🖐️ @${selfName} le arrimó un bofetón a @${targetName}`;

            await sock.sendMessage(from, { 
                video: { url: gifUrl }, 
                caption: frase,
                gifPlayback: true,
                mentions: [sender, objetivo]
            }, { quoted: m });

        } catch (e) {
            console.error(`ERROR EN ${command.toUpperCase()}:`, e);
            await sock.sendMessage(from, { text: '❌ La API anda de floja, intenta de nuevo.' });
        }
    }
};
