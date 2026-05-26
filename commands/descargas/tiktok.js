import axios from 'axios';

/**
 * 📥 COMANDO: TikTok Ráfaga (Full Config)
 * 📝 DESCRIPCIÓN: Busca y descarga 5 videos sin marcas de agua.
 * 👤 CREADOR: Charly Developer
 */

export default {
    name: 'tiktok',
    category: 'descargas',
    aliases: ['tt', 'tk'],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué buscamos en TikTok? Ejemplo: .tt free fire clips' });

        // Configuración de la API (Keys integradas)
        const RAPID_KEY = "e774e5f65fmsh8a64771078f8baap19a40cjsn79a68c1e252f";
        const RAPID_HOST = "tiktok-scraper7.p.rapidapi.com";

        // Reacción de búsqueda
        await sock.sendMessage(from, { react: { text: "🔍", key: m.key } });
        await sock.sendMessage(from, { text: `🔍 *Buscando los 5 mejores videos de:* _${text}_...` });

        try {
            const options = {
                method: 'GET',
                url: `https://${RAPID_HOST}/feed/search`,
                params: {
                    keywords: text,
                    region: 'mx',
                    count: '5' 
                },
                headers: {
                    'x-rapidapi-key': RAPID_KEY,
                    'x-rapidapi-host': RAPID_HOST
                }
            };

            const response = await axios.request(options);
            const listaVideos = response.data.data; 

            if (!listaVideos || listaVideos.length === 0) {
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                return sock.sendMessage(from, { text: '❌ No hallé resultados para esa búsqueda.' });
            }

            const top5 = listaVideos.slice(0, 5);
            
            for (let i = 0; i < top5.length; i++) {
                try {
                    const v = top5[i];
                    const videoUrl = v.play; // URL sin marca de agua

                    if (!videoUrl) continue;

                    const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload [${i + 1}/5]　ׄᰙ\n\n𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${v.title || 'Sin título'}\n𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${v.author?.nickname || 'Desconocido'}\n𖣣ֶㅤ֯⬭ ✿  ׄ ⬭ *Vistas:* ${(v.play_count || 0).toLocaleString()}\n\n⚡ *Charly-Bot Maestro V2*`.trim();

                    // Envío del video directo al chat
                    await sock.sendMessage(from, { 
                        video: { url: videoUrl }, 
                        caption: caption 
                    }, { quoted: m });

                    // Delay de 2.5 segundos para evitar ban o saturación de red
                    await new Promise(resolve => setTimeout(resolve, 2500));

                } catch (vErr) {
                    console.error(`Error en el video ${i + 1}:`, vErr.message);
                }
            }

            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
            await sock.sendMessage(from, { text: '🏁 *Ráfaga completada.* ¡Disfruta los videos!' });

        } catch (error) {
            console.error("ERROR TIKTOK RÁFAGA:", error);
            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            await sock.sendMessage(from, { text: '❌ La API de TikTok está saturada o la Key expiró.' });
        }
    }
};
