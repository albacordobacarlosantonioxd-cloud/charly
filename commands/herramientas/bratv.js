import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import axios from 'axios';

export default {
    name: 'bratv',
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué frase quieres en el sticker animado? Ejemplo: *.bratv La MT09*' });

        try {
            // Reacción de espera
            await sock.sendMessage(from, { react: { text: '🕒', key: m.key } });

            const urlBratV = `https://skyzxu-brat.hf.space/brat-animated?text=${encodeURIComponent(text)}`;
            const response = await axios.get(urlBratV, { responseType: 'arraybuffer' });
            
            if (!response.data) throw new Error('No data');

            const buffer = Buffer.from(response.data);

            const sticker = new Sticker(buffer, {
                pack: 'Charly-Bot', 
                author: 'Charly',    
                type: StickerTypes.FULL, // Mantiene la animación completa
                quality: 70, // Ajustamos calidad para no saturar tus 4GB de RAM
            });

            const stickerBuffer = await sticker.toBuffer();

            // Enviar el sticker animado
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
            
            // Reacción de éxito
            await sock.sendMessage(from, { react: { text: '✔️', key: m.key } });

        } catch (e) {
            console.error("ERROR BRATV:", e.message);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(from, { text: '❌ No se pudo crear el sticker animado.' });
        }
    }
};
