import axios from 'axios';
import yts from 'yt-search';

export default {
    name: "ytvideo",
    category: 'descargas',
    aliases: ["video"],
    run: async (sock, m, from, text, command) => {
        const key = "sasuke";
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";

        if (!text) return sock.sendMessage(from, { text: `*Escribe el nombre del video.*` }, { quoted: m });

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            // 1. Buscamos el video
            const search = await yts(text);
            const video = search.all[0];
            if (!video) return sock.sendMessage(from, { text: '⚠️ No se encontró.' });

            // 2. Pedimos el link a la API (usando el endpoint de tu imagen)
            const dlApi = `https://api.evogb.org/dl/ytmp4?url=${encodeURIComponent(video.url)}&quality=360p&key=${key}`;
            const { data } = await axios.get(dlApi);

            if (!data.status) throw new Error("API error");

            // 3. DESCARGA A BUFFER (Solución para el error de reproducción)
            const response = await axios({
                method: 'get',
                url: data.data.url,
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const videoBuffer = Buffer.from(response.data);

            // 4. Enviar como video real
            await sock.sendMessage(from, { 
                video: videoBuffer, 
                caption: `✅ *${video.title}*\n⚡ *${dev}*`,
                mimetype: 'video/mp4',
                fileName: `${video.title}.mp4`
            }, { quoted: m });

            // Limpieza manual para cuidar tu Giga de RAM
            response.data = null;

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 Error: El archivo no es compatible o el servidor falló.' });
        }
    }
};
