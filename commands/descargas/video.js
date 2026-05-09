import axios from 'axios';

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
                text: `*🏮 [ CHARLY-BOT VIDEO ]*\n\n*Escribe el nombre o link del video.*\n*Ejemplo:* .video Noche Perfecta` 
            }, { quoted: m });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(text)}&type=video&quality=720&key=${key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '⚠️ No se encontró el video.' }, { quoted: m });
            }

            const yt = data.data;
            const videoUrl = yt.download.url;

            // --- MEJORA: DESCARGA A BUFFER PARA EVITAR ERRORES DE REPRODUCCIÓN ---
            const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
            const videoBuffer = Buffer.from(response.data, 'utf-8');

            let info = `┏━━━━━━━━━━━━━━━━━━┓\n┃   🎥 *YOUTUBE VIDEO* 🎥\n┣━━━━━━━━━━━━━━━━━━┛\n┃\n┃ 📝 *Tíᴛᴜʟᴏ:* ${yt.title}\n┃ 🕒 *Dᴜʀᴀᴄɪóɴ:* ${yt.duration.timestamp}\n┃ ⚖️ *Pᴇsᴏ:* ${yt.quality_contex}\n┃\n┣━━━━━━━━━━━━━━━━━━┓\n┃ ⚡ *${dev}*\n┃ 📡 *${chn}*\n┗━━━━━━━━━━━━━━━━━━┛`;

            // Enviar info con miniatura
            await sock.sendMessage(from, { 
                image: { url: yt.image }, 
                caption: info 
            }, { quoted: m });

            // Enviar el video desde el Buffer (esto asegura que el archivo llegue íntegro)
            await sock.sendMessage(from, { 
                video: videoBuffer, 
                caption: `✅ *Descarga Exitosa*`,
                mimetype: 'video/mp4',
                fileName: `${yt.title}.mp4`
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("Error en YouTube Video Buffer:", error);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 El archivo es muy pesado o la API falló. Intenta con un video más corto.' }, { quoted: m });
        }
    }
};
