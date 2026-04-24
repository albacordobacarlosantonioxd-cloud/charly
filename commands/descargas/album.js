module.exports = {
    name: 'album',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: '¿De quién buscamos el álbum, pariente?' });

        try {
            const yts = require('yt-search');
            const axios = require('axios');
            const apiKey = process.env.SYLPHY_KEY; 

            const search = await yts(text);
            if (!search || !search.videos.length) return sock.sendMessage(from, { text: '❌ No hallé nada.' });

            const canciones = search.videos.slice(0, 5); 
            await sock.sendMessage(from, { text: `💿 Preparando *${canciones.length}* canciones. Esto evita el error de 0kb, aguanta...` });

            for (let v of canciones) {
                try {
                    const res = await axios.get(`https://sylphy.xyz/download/ytmp3?url=${encodeURIComponent(v.url)}&api_key=${apiKey}`);
                    const dl_url = res.data.result?.dl_url;

                    if (dl_url) {
                        const response = await axios.get(dl_url, { 
                            responseType: 'arraybuffer',
                            headers: { 'User-Agent': 'Mozilla/5.0' }
                        });

                        await sock.sendMessage(from, { 
                            audio: Buffer.from(response.data), 
                            mimetype: 'audio/mp4', 
                            fileName: `${v.title}.mp3` 
                        }, { quoted: m });
                    }

                    await new Promise(r => setTimeout(r, 3000));

                } catch (err) {
                    console.error(`Error en rola: ${v.title}`, err.message);
                    continue;
                }
            }
            await sock.sendMessage(from, { text: '✅ *Álbum enviado con éxito.*' });

        } catch (e) {
            console.error("ERROR ALBUM:", e);
            await sock.sendMessage(from, { text: '❌ Error al procesar el álbum.' });
        }
    }
};