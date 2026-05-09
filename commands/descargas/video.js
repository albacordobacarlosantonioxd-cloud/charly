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
            
            // Enviamos la info primero
            let info = `┏━━━━━━━━━━━━━━━━━━┓\n┃   🎥 *YOUTUBE VIDEO* 🎥\n┣━━━━━━━━━━━━━━━━━━┛\n┃\n┃ 📝 *Tíᴛᴜʟᴏ:* ${yt.title}\n┃ 🕒 *Dᴜʀᴀᴄɪóɴ:* ${yt.duration.timestamp}\n┃ ⚖️ *Pᴇsᴏ:* ${yt.quality_contex}\n┃\n┣━━━━━━━━━━━━━━━━━━┓\n┃ ⚡ *${dev}*\n┃ 📡 *${chn}*\n┗━━━━━━━━━━━━━━━━━━┛\n\n> 📥 *Enviando como documento para evitar errores de reproducción...*`;

            await sock.sendMessage(from, { image: { url: yt.image }, caption: info }, { quoted: m });

            // Descargamos el video (respetando tu límite de 1GB de RAM en Railway)
            const response = await axios({
                method: 'get',
                url: yt.download.url,
                responseType: 'arraybuffer',
                maxContentLength: 700 * 1024 * 1024 // Límite de 700MB para seguridad
            });

            const videoBuffer = Buffer.from(response.data);

            // ENVIAR COMO DOCUMENTO (Esto soluciona el "No disponible")
            await sock.sendMessage(from, { 
                document: videoBuffer, 
                mimetype: 'video/mp4',
                fileName: `${yt.title}.mp4`,
                caption: `✅ *${yt.title}*\n\n*Nota:* Al enviarse como documento, descárgalo para verlo sin errores.`
            }, { quoted: m });

            // Limpieza inmediata de memoria para el Giga de Railway
            response.data = null; 

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("Error en YouTube Video Documento:", error);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 El video es demasiado pesado o hubo un fallo en la red.' }, { quoted: m });
        }
    }
};
