import axios from 'axios';

export default {
    name: 'kiss',
    category: 'herramientas',
    aliases: ['hug', 'slap'],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup, sender) => {
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || "";
        const command = body.trim().slice(1).split(' ')[0].toLowerCase();
        
        const contextInfo = m.message?.extendedTextMessage?.contextInfo;
        let mentioned = contextInfo?.mentionedJid?.[0];
        let quotedParticipant = contextInfo?.participant;
        
        // Si hay quotedMessage pero no hay participant, intentar obtenerlo del quotedMessage
        if (!quotedParticipant && quoted && quoted.key) {
            quotedParticipant = quoted.key.participant || quoted.key.remoteJid;
        }
        
        const objetivo = mentioned || quotedParticipant;

        if (!objetivo || typeof objetivo !== 'string') {
            return sock.sendMessage(from, { 
                text: `⚠️ ¡Epa! Etiqueta a alguien o responde a su mensaje para usar .${command}, pariente.` 
            }, { quoted: m });
        }

        try {
            const response = await axios.get(`https://api.waifu.pics/sfw/${command}`);
            const gifUrl = response.data.url;
            
            const targetName = objetivo.split('@')[0];
            const selfName = sender ? sender.split('@')[0] : 'Yo';
            
            let frase = '';
            if (command === 'kiss') frase = `👩‍❤️‍💋‍👨 @${selfName} le dio un beso a @${targetName}`;
            if (command === 'hug') frase = `🫂 @${selfName} abrazó a @${targetName}`;
            if (command === 'slap') frase = `🖐️ @${selfName} le arrimó un bofetón a @${targetName}`;

            await sock.sendMessage(from, { 
                video: { url: gifUrl }, 
                caption: frase,
                gifPlayback: true,
                mentions: [sender, objetivo].filter(Boolean)
            }, { quoted: m });

        } catch (e) {
            console.error(`ERROR EN ${command.toUpperCase()}:`, e);
            await sock.sendMessage(from, { text: '❌ La API anda de floja, intenta de nuevo.' });
        }
    }
};