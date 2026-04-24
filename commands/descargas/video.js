module.exports = {
    name: 'video',
    aliases: ['ytvideo'],
    run: async (sock, m, from, text, quoted) => {
        const yts = require('yt-search');
        const axios = require('axios');
        if (!text) return sock.sendMessage(from, { text: '¿Qué video buscamos, pariente? Pasa el nombre o link.' });
        
        try {
            let videoData = null;

            await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

            if (text.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
                const videoId = yts.parseVideoId(text);
                videoData = await yts({ videoId: videoId });
            } else {
                const search = await yts(text);
                if (!search || !search.videos.length) {
                    return sock.sendMessage(from, { text: '❌ No hallé el video.' });
                }
                videoData = search.videos[0];
            }

            if (videoData.seconds > 4800) {
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

                    await sock.sendMessage(from, { 
                        video: { url: dl_url }, 
                        caption: `✅ *${videoData.title}*`,
                        mimetype: 'video/mp4',
                        fileName: `${videoData.title}.mp4`
                    }, { quoted: m });

                    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

                } else {
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