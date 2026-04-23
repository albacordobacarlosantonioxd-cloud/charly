const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const axios = require('axios');

module.exports = {
    name: 'brat',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué frase quieres en el sticker, pariente? Ejemplo: *.brat La MT09*' });

        try {
            await sock.sendMessage(from, { react: { text: "🎨", key: m.key } });

            const apiKey = 'sylphy-ty5xtWm';
            const urlBrat = `https://sylphyy.xyz/tools/brat?text=${encodeURIComponent(text)}&api_key=${apiKey}`;

            const response = await axios.get(urlBrat, { responseType: 'arraybuffer' });
            
            if (response.headers['content-type'].includes('application/json')) {
                return sock.sendMessage(from, { text: '❌ La API mandó un error. Revisa tu API Key.' });
            }

            const buffer = Buffer.from(response.data);
            const sticker = new Sticker(buffer, {
                pack: 'Brat Pack', 
                author: 'Master Bot', 
                type: StickerTypes.FULL,
                quality: 80,
            });

            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

        } catch (e) {
            console.error("ERROR BRAT:", e.message);
            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            await sock.sendMessage(from, { text: '❌ Valio queso. Intenta con un texto más corto o revisa tu conexión.' });
        }
    }
};
