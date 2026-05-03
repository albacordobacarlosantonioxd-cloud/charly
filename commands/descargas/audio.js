import axios from 'axios';
import yts from 'yt-search';
import { safeReact } from '../../global.js';

export default {
    name: 'audio',
    category: 'descargas',
    aliases: ['ytaudio'],
    run: async (sock, m, from, text, quoted) => {
        const query = text;
        if (!query) return sock.sendMessage(from, { text: '⚠️ ¡Epa! Escribe el nombre o pega el link, pariente.' }, { quoted: m });

        try {
            let videoData = null;

            await safeReact(sock, from, "⏳", m.key);

            if (query.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
                const videoId = yts.parseVideoId(query);
                videoData = await yts({ videoId: videoId });
            } else {
                const search = await yts(query);
                if (!search || !search.videos.length) {
                    await safeReact(sock, from, "❌", m.key);
                    return sock.sendMessage(from, { text: '❌ No encontré esa rola.' });
                }
                videoData = search.videos[0];
            }

            const videoUrl = videoData.url;
            const videoTitle = videoData.title;
            const vistas = (videoData.views || 0).toLocaleString();
            const canal = videoData.author?.name || 'Desconocido';

            const infoMessage = `➩ Descargando Audio › *${videoTitle}*\n\n` +
                                `> ❖ Canal › *${canal}*\n` +
                                `> ⴵ Duración › *${videoData.timestamp || '??::??'}*\n` +
                                `> ❀ Vistas › *${vistas}*\n` +
                                `> ✩ Publicado › *${videoData.ago || 'Reciente'}*\n` +
                                `> ❒ Enlace › *${videoUrl}*`;

            await sock.sendMessage(from, { 
                image: { url: videoData.image || videoData.thumbnail }, 
                caption: infoMessage 
            }, { quoted: m });

            const apiUrl = `https://sylphyy.xyz/download/v2/ytmp3?url=${encodeURIComponent(videoUrl)}&api_key=sylphy-ty5xtWm`;
            const res = await axios.get(apiUrl);
            
            if (res.data.status && res.data.result && res.data.result.dl_url) {
                const downloadUrl = res.data.result.dl_url;
                const fileName = res.data.result.title || `${videoTitle}.mp3`;

                await sock.sendMessage(from, { 
                    audio: { url: downloadUrl }, 
                    mimetype: 'audio/mpeg',
                    fileName: fileName,
                    ptt: false 
                }, { quoted: m });

                await safeReact(sock, from, "✅", m.key);
            } else {
                await safeReact(sock, from, "❌", m.key);
                return sock.sendMessage(from, { text: '❌ La API v2 no soltó el archivo. Intenta con otra rola.' });
            }
        } catch (e) {
            console.error("ERROR EN YTAUDIO:", e.message);
            await safeReact(sock, from, "❌", m.key);
            await sock.sendMessage(from, { text: `❌ Valio queso, pariente. Error: ${e.message}` });
        }
    }
};
