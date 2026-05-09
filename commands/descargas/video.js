import axios from 'axios';

export default {
    name: "ytvideo",
    category: 'descargas',
    aliases: ["video", "playvideo"],
    run: async (sock, m, from, text) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";
        const key = "sasuke";

        if (!text) {
            return sock.sendMessage(from, { 
                text: `*🏮 [ CHARLY-BOT VIDEO ]*\n\n*Escribe el nombre de lo que buscas para descargar el video.*\n*Ejemplo:* .ytvideo Noche Perfecta Fuerza Regida` 
            }, { quoted: m });
        }

        // Reacción de procesamiento
        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            // Basado en el endpoint de tu captura: api.evogb.org
            const apiUrl = `https://api.evogb.org/dl/youtubeplay?query=${encodeURIComponent(text)}&type=video&quality=720&key=${key}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '⚠️ No se encontró el video en los servidores.' }, { quoted: m });
            }

            const yt = data.data;
            
            // Interfaz de información del video
            let info = `┏━━━━━━━━━━━━━━━━━━┓\n`;
            info += `┃   🎥 *YOUTUBE VIDEO* 🎥\n`;
            info += `┣━━━━━━━━━━━━━━━━━━┛\n`;
            info += `┃\n`;
            info += `┃ 📝 *Tíᴛᴜʟᴏ:* ${yt.title}\n`;
            info += `┃ 🕒 *Dᴜʀᴀᴄɪóɴ:* ${yt.duration.timestamp}\n`;
            info += `┃ 👁️ *Vɪsᴛᴀs:* ${yt.views}\n`;
            info += `┃ 👤 *Cᴀɴᴀʟ:* ${yt.author.name}\n`;
            info += `┃\n`;
            info += `┣━━━━━━━━━━━━━━━━━━┓\n`;
            info += `┃ ⚡ *${dev}*\n`;
            info += `┃ 📡 *${chn}*\n`;
            info += `┗━━━━━━━━━━━━━━━━━━┛\n\n`;
            info += `🚀 *Enviando archivo MP4...*`;

            // 1. Enviamos la miniatura con los detalles técnicos
            await sock.sendMessage(from, { 
                image: { url: yt.image }, 
                caption: info 
            }, { quoted: m });

            // 2. Enviamos el video (Streaming directo desde la API a WhatsApp)
            await sock.sendMessage(from, { 
                video: { url: yt.download.url }, 
                caption: `✅ *Resultado:* ${yt.title}`,
                mimetype: 'video/mp4',
                fileName: yt.download.filename
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("Error en YouTube Video:", error);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 Error al procesar el video en CHARLY-BOT.' }, { quoted: m });
        }
    }
};
