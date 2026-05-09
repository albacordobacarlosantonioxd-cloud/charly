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
                text: `*🏮 [ CHARLY-BOT VIDEO ]*\n\n*Escribe el nombre o link del video.*` 
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

            // 1. Enviamos la info con miniatura
            let info = `┏━━━━━━━━━━━━━━━━━━┓\n┃   🎥 *YOUTUBE VIDEO* 🎥\n┣━━━━━━━━━━━━━━━━━━┛\n┃ 📝 *Tíᴛᴜʟᴏ:* ${yt.title}\n┃ ⚖️ *Pᴇsᴏ:* ${yt.quality_contex}\n┗━━━━━━━━━━━━━━━━━━┛\n\n> 🚀 *Procesando envío seguro...*`;
            await sock.sendMessage(from, { image: { url: yt.image }, caption: info }, { quoted: m });

            // 2. ENVÍO DIRECTO (Sin Buffer pesado para no quemar el Giga de RAM)
            // Esto hace que WhatsApp lo reciba como un video nativo compatible
            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: `✅ *Resultado:* ${yt.title}`,
                mimetype: 'video/mp4',
                fileName: `${yt.title}.mp4`
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("Error en YouTube Video compatible:", error.message);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 Hubo un error de compatibilidad. Intenta de nuevo.' }, { quoted: m });
        }
    }
};
