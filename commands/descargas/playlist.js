module.exports = {
    name: 'playlist',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return await sock.sendMessage(from, { text: 'Por favor, ingresa el enlace de la playlist de Spotify.' }, { quoted: m });
        
        const spotifyUrlInfo = require('spotify-url-info');
        const axios = require('axios');

        try {
            await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });
            await sock.sendMessage(from, { text: `🎧 *Descargando playlist de Spotify:* ${text}` }, { quoted: m });

            const info = await spotifyUrlInfo.get(text);
            if (!info || !info.tracks || info.tracks.items.length === 0) {
                return sock.sendMessage(from, { text: '❌ No se pudo obtener información de la playlist o no contiene canciones.' }, { quoted: m });
            }

            for (const track of info.tracks.items) {
                const trackName = track.track.name;
                const artistName = track.track.artists.map(artist => artist.name).join(', ');
                const searchName = `${trackName} ${artistName}`;

                const apiUrl = `https://sylphy.xyz/download/ytmp3?query=${encodeURIComponent(searchName)}&api_key=${process.env.SYLPHY_KEY}`;
                const res = await axios.get(apiUrl);

                if (res.data.status && res.data.result && res.data.result.dl_url) {
                    const downloadUrl = res.data.result.dl_url;
                    await sock.sendMessage(from, { 
                        audio: { url: downloadUrl }, 
                        mimetype: 'audio/mpeg',
                        fileName: `${trackName} - ${artistName}.mp3`,
                        ptt: false 
                    }, { quoted: m });
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Espera entre descargas
                } else {
                    await sock.sendMessage(from, { text: `⚠️ No pude descargar: ${trackName} - ${artistName}` });
                }
            }
            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
            await sock.sendMessage(from, { text: '✅ *Playlist descargada con éxito.*' });

        } catch (e) {
            console.error("ERROR PLAYLIST:", e);
            await sock.sendMessage(from, { text: `❌ Hubo un error al procesar la playlist: ${e.message}` });
        }
    }
};