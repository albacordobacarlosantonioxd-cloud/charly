const axios = require('axios');

module.exports = {
    name: 'nsfw',
    aliases: ['anal', 'cum', 'fuck', 'spank', 'undress', 'yuri', 'sixnine', 'cummouth', 'suckboobs', 'cumshot', 'lickpussy', 'lickdick', 'lickass', 'handjob', 'grope', 'fingering', 'creampie', 'facesitting', 'futanari', 'pegging', 'bondage', 'deepthroat', 'thighjob', 'yaoi', 'bukkake', 'orgy', 'grabboobs', 'blowjob', 'boobjob', 'fap', 'footjob', 'squirting'],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        const Group = require('../../index.js').Group;
        const groupConfig = await Group.findOne({ id: from });

        if (isGroup && groupConfig?.sfw) {
            return sock.sendMessage(from, { text: '🚫 *Comando Bloqueado:* El modo SFW está activo.' }, { quoted: m });
        }

        const command = args[0] ? args[0].toLowerCase() : m.text.slice(1).split(' ')[0].toLowerCase();
        const apiAction = command;

        try {
            const apiKey = 'api-qG4nw';
            const emisor = m.pushName || 'Usuario';
            let personaEtiquetada = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || null;
            let textoMencion = personaEtiquetada ? `@${personaEtiquetada.split('@')[0]}` : "a todos";

            const response = await axios.get(`https://api.stellarwa.xyz/nsfw/interaction?inter=${apiAction}&key=${apiKey}`);
            const gifUrl = response.data.result;

            if (!gifUrl) throw new Error("Link no encontrado en la API");

            await sock.sendMessage(from, { 
                video: { url: gifUrl }, 
                caption: `🔞 *${emisor}* está haciendo ${apiAction} con ${textoMencion}!`,
                gifPlayback: true,
                mentions: personaEtiquetada ? [personaEtiquetada] : [] 
            }, { quoted: m });

        } catch (e) {
            console.error(`ERROR EN NSFW (${command}):`, e.message);
            await sock.sendMessage(from, { text: '❌ La API de Stellar anda lenta o el link falló.' });
        }
    }
};
