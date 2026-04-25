import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import axios from 'axios';

export default {
    name: 'brat',
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué frase quieres en el sticker, pariente? Ejemplo: *.brat La MT09*' });

        try {
            const apiKey = process.env.SYLPHY_KEY;
            const urlBrat = `https://sylphyy.xyz/tools/brat?text=${encodeURIComponent(text)}&api_key=${apiKey}`;

            const response = await axios.get(urlBrat, { responseType: 'arraybuffer' });
            
            if (response.headers['content-type'].includes('application/json')) {
                return sock.sendMessage(from, { text: '❌ La API mandó un error. Revisa tu API Key en el .env.' });
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

        } catch (e) {
            console.error("ERROR BRAT:", e.message);
            await sock.sendMessage(from, { text: '❌ Valio queso. Intenta de nuevo.' });
        }
    }
};