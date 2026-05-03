import yts from 'yt-search';
import axios from 'axios';
import { safeReact } from '../../global.js';

export default {
    name: 'video',
    category: 'descargas',
    aliases: ['ytvideo'],
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué video buscamos, pariente? Pasa el nombre o link.' });
        
        try {
            let videoData = null;

            await safeReact(sock, from, "⏳", m.key);

            if (text.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
                const videoId = yts.parseVideoId(text);
                videoData = await yts({ videoId: videoId });
            } else {
                const search = await yts(text);
                if (!search || !search.videos.length) {
                    await safeReact(sock, from, "❌", m.key);
                    return sock.sendMessage(from, { text: '❌ No hallé el video.' });
                }
                videoData = search.videos[0];
            }

            // Límite de 1h 20min
            if (videoData.seconds > 4800) {
                await safeReact(sock, from, "⚠️", m.key);
                return sock.sendMessage(from, { text: `⚠️ Muy largo. El límite es 1h 20min.` });
            }

            await sock.sendMessage(from, { 
                image: { url: videoData.image || videoData.thumbnail }, 
                caption: `➩ Descargando: *${videoData.title}*\n> Duración: *${videoData.timestamp}*` 
            }, { quoted: m });

            try {
                const res = await axios.get(
                    `https://sylphyy.xyz/download/v2/ytmp4?url=${encodeURIComponent(videoData.url)}&q=720p&api_key=sylphy-ty5xtWm`,
                    { timeout: 30000 }
                );

               if (res.data && res.data.status && res.data.result?.dl_url) {
    const dl_url = res.data.result.dl_url;

    // 1. Descargamos el video a un Buffer para evitar el error de streaming
    const response = await axios({
        method: 'get',
        url: dl_url,
        responseType: 'arraybuffer', // Crucial para archivos multimedia
        timeout: 60000, // Le damos 1 minuto por si el video es pesado
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });

    const buffer = Buffer.from(response.data);

    // 2. Enviamos el Buffer directamente
    await sock.sendMessage(from, { 
        video: buffer, 
        caption: `✅ *${videoData.title}*`,
        mimetype: 'video/mp4',
        fileName: `${videoData.title}.mp4`
    }, { quoted: m });

    await safeReact(sock, from, "✅", m.key);

}
                else {
                    let rawRes = JSON.stringify(res.data).substring(0, 500);
                    return sock.sendMessage(from, { text: `❌ _Error del Servidor:_ No devolvió link de descarga.\n\n*Respuesta:* ${rawRes}` });
                }

            } catch (apiErr) {
                let errInfo = `❌ *Fallo de Conexión:*\n> Mensaje: ${apiErr.message}\n> Código: ${apiErr.code || 'N/A'}`;
                return sock.sendMessage(from, { text: errInfo });
            }

        } catch (e) {
            console.error(e);
            return sock.sendMessage(from, { text: `❌ *Error General:* ${e.message}` });
        }
    }
};
