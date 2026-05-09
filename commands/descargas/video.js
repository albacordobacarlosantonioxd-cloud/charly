import axios from 'axios';
import yts from 'yt-search';

export default {
    name: "ytvideo",
    category: 'descargas',
    aliases: ["video"],
    run: async (sock, m, from, text, command) => {
        const key = "sasuke";

        if (!text) return sock.sendMessage(from, { text: `*Escribe el nombre del video.*` }, { quoted: m });

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const search = await yts(text);
            const video = search.all[0];
            if (!video) return sock.sendMessage(from, { text: '⚠️ No se encontró.' });

            // CAMBIO CLAVE: Usamos calidad 360p para evitar el error de reproducción
            const dlApi = `https://api.evogb.org/dl/ytmp4?url=${encodeURIComponent(video.url)}&quality=360p&key=${key}`;
            const { data } = await axios.get(dlApi);

            if (!data.status) throw new Error("API error");

            // MANDAR COMO VIDEO NATIVO (Sin Buffer para ahorrar tu Giga de RAM)
            await sock.sendMessage(from, { 
                video: { url: data.data.url }, 
                caption: `✅ *${video.title}*`,
                mimetype: 'video/mp4' // Forzamos el tipo de archivo
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 Error de servidor. Intenta con otro video.' });
        }
    }
};
