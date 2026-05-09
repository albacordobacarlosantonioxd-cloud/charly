import axios from 'axios';
import yts from 'yt-search';

export default {
    name: "ytvideo",
    category: 'descargas',
    aliases: ["video", "playvideo"],
    run: async (sock, m, from, text, command) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";
        const key = "sasuke";

        if (!text) {
            return sock.sendMessage(from, { 
                text: `*🏮 [ CHARLY-BOT VIDEO ]*\n\n*Escribe el nombre del video.*\n*Ejemplo:* .video Noche Perfecta` 
            }, { quoted: m });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            // 1. PASO: BÚSQUEDA CON YT-SEARCH
            const search = await yts(text);
            const video = search.all[0]; // Tomamos el primer resultado

            if (!video) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '⚠️ No se encontraron resultados.' }, { quoted: m });
            }

            const videoUrl = video.url;
            
            // 2. PASO: ENVIAR INFO E IMAGEN PROCESADA
            let info = `┏━━━━━━━━━━━━━━━━━━┓\n┃   🎥 *YOUTUBE VIDEO* 🎥\n┣━━━━━━━━━━━━━━━━━━┛\n┃\n┃ 📝 *Tíᴛᴜʟᴏ:* ${video.title}\n┃ 🕒 *Dᴜʀᴀᴄɪóɴ:* ${video.timestamp}\n┃ 👁️ *Vɪsᴛᴀs:* ${video.views}\n┃ 🔗 *Lɪɴᴋ:* ${videoUrl}\n┃\n┣━━━━━━━━━━━━━━━━━━┓\n┃ ⚡ *${dev}*\n┃ 📡 *${chn}*\n┗━━━━━━━━━━━━━━━━━━┛\n\n> 📥 *Descargando video en 720p...*`;

            await sock.sendMessage(from, { 
                image: { url: video.thumbnail }, 
                caption: info 
            }, { quoted: m });

            // 3. PASO: PETICIÓN AL ENDPOINT DE LA IMAGEN (api.evogb.org/dl/ytmp4)
            const dlApi = `https://api.evogb.org/dl/ytmp4?url=${encodeURIComponent(videoUrl)}&quality=720p&key=${key}`;
            const { data } = await axios.get(dlApi);

            if (!data.status || !data.data) {
                throw new Error("Error en el endpoint de descarga");
            }

            const downloadLink = data.data.url;

            // 4. PASO: ENVÍO DEL VIDEO
            await sock.sendMessage(from, { 
                video: { url: downloadLink }, 
                caption: `✅ *Descarga Completa:* ${video.title}`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("Error en proceso YT Search + DL:", error);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 Hubo un fallo al procesar la descarga. Intenta con un link directo.' }, { quoted: m });
        }
    }
};
