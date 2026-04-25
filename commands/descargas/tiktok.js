import axios from 'axios';
import { safeReact } from '../../global.js';

export default {
    name: 'tiktok',
    category: 'descargas',
    aliases: ['tt'],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué buscamos en TikTok? Ejemplo: .tt pvta luna' });

        await safeReact(sock, from, "🔍", m.key);
        await sock.sendMessage(from, { text: `🔍 *Buscando los 5 mejores videos de:* _${text}_...` });

        try {
            const options = {
                method: 'GET',
                url: 'https://tiktok-scraper7.p.rapidapi.com/feed/search',
                params: {
                    keywords: text,
                    region: 'mx',
                    count: '5' 
                },
                headers: {
                    'x-rapidapi-key': process.env.TIKTOK_RAPIDAPI_KEY,
                    'x-rapidapi-host': process.env.TIKTOK_RAPIDAPI_HOST
                }
            };

            const response = await axios.request(options);
            const listaVideos = response.data.data.videos; 

            if (!listaVideos || listaVideos.length === 0) {
                await safeReact(sock, from, "❌", m.key);
                return sock.sendMessage(from, { text: '❌ No hallé resultados para esa búsqueda.' });
            }

            const top5 = listaVideos.slice(0, 5);
            
            for (let i = 0; i < top5.length; i++) {
                const v = top5[i];
                const title = v.title || 'Sin título';
                const author = v.author?.nickname || v.author?.unique_id || 'Desconocido';
                const duration = v.duration || 'N/A';
                const likes = (v.digg_count || 0).toLocaleString();
                const comments = (v.comment_count || 0).toLocaleString();
                const views = (v.play_count || 0).toLocaleString();
                const shares = (v.share_count || 0).toLocaleString();
                const created_at = v.create_time ? new Date(v.create_time * 1000).toLocaleDateString('es-MX') : 'N/A';
                const videoUrl = v.play;

                const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload [${i + 1}/5]　ׄᰙ\n\n𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${title}\n𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${author}\n𖣣ֶㅤ֯⌗ ⴵ  ׄ ⬭ *Duración:* ${duration}s\n𖣣ֶㅤ֯⌗ ❖  ׄ ⬭ *Likes:* ${likes}\n𖣣ֶㅤ֯⌗ ❀  ׄ ⬭ *Comentarios:* ${comments}\n𖣣ֶㅤ֯⬭ ✿  ׄ ⬭ *Vistas:* ${views}\n𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Compartidos:* ${shares}\n𖣣ֶㅤ֯⌗ ☁︎  ׄ ⬭ *Fecha:* ${created_at}`.trim();

                await sock.sendMessage(from, { 
                    video: { url: videoUrl }, 
                    caption: caption 
                }, { quoted: m });

                // Un pequeño delay para no saturar el envío
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            await safeReact(sock, from, "✅", m.key);
            await sock.sendMessage(from, { text: '🏁 *Ráfaga completada.* ¡Ahí quedaron los 5, pariente!' });

        } catch (error) {
            console.error("ERROR TIKTOK RÁFAGA:", error);
            await safeReact(sock, from, "❌", m.key);
            await sock.sendMessage(from, { text: '❌ Hubo un error al procesar la ráfaga de videos.' });
        }
    }
};
