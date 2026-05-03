import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'sticker',
    category: 'herramientas',
    aliases: ['s'],
    run: async (sock, m, from, text, quoted) => {
        try {
            const mime = (m.message.imageMessage || m.message.videoMessage) 
                ? (m.message.imageMessage ? 'image' : 'video') 
                : (quoted?.imageMessage ? 'image' : quoted?.videoMessage ? 'video' : null);

            if (!mime) return sock.sendMessage(from, { text: '❌ Responde a una imagen o video, pariente.' }, { quoted: m });

            await sock.sendMessage(from, { text: '⏳ Cocinando tu sticker...' });

            const messageType = mime === 'image' 
                ? (m.message.imageMessage || quoted.imageMessage) 
                : (m.message.videoMessage || quoted.videoMessage);
            
            const stream = await downloadContentFromMessage(messageType, mime);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const sticker = new Sticker(buffer, {
                pack: 'Bot de Miguel Auza 🚀',
                author: 'Gemini Bot',
                type: StickerTypes.FULL,
                categories: ['🤩', '🎉'],
                quality: 70,
            });

            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
        } catch (error) {
            console.error("Error creating sticker:", error);
            await sock.sendMessage(from, { text: "❌ Ocurrió un error al crear el sticker." }, { quoted: m });
        }
    }
};