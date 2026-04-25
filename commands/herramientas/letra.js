import axios from 'axios';

export default {
    name: 'letra',
    category: 'herramientas',
    aliases: ['lyrics', 'l'],
    run: async (sock, m, from, text, quoted) => {
        if (!text) return await sock.sendMessage(from, { text: '¿De qué canción quieres la letra, pariente? Ejemplo: *.letra El Azul*' }, { quoted: m });

        try {
            const apiKey = process.env.SYLPHY_KEY || 'sylphy-ty5xtWm';
            const apiUrl = `https://sylphyy.xyz/search/lyrics?title=${encodeURIComponent(text)}&api_key=${apiKey}`;

            const response = await axios.get(apiUrl);
            
            if (response.data && response.data.status && response.data.result && response.data.result.lyrics) {
                const { title, artist, lyrics } = response.data.result;

                let txt = `🎵 *TÍTULO:* ${title}\n`;
                txt += `👤 *ARTISTA:* ${artist}\n\n`;
                txt += `📑 *LETRA:*\n\n${lyrics}`;

                await sock.sendMessage(from, { text: txt }, { quoted: m });
            } else {
                await sock.sendMessage(from, { text: '❌ No hallé la letra de esa canción, checa que esté bien escrita.' });
            }

        } catch (e) {
            console.error("ERROR LETRAS API:", e);
            await sock.sendMessage(from, { text: '❌ Valio queso el servidor de letras, intenta más tarde.' });
        }
    }
};