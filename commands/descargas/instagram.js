module.exports = {
    name: 'instagram',
    aliases: ['ig'],
    run: async (sock, m, from, text, quoted) => {
        const axios = require('axios');
        const query = (text || "").trim();
        if (!query || !query.includes('instagram.com')) {
            return await sock.sendMessage(from, { text: '❌ Pega un link de Instagram, pariente.' }, { quoted: m });
        }

        const apiKey = 'sylphy-ty5xtWm';

        try {
            console.log(`\n[📸] --- DESCARGA IG: SOLO VIDEOS ---`);
            await sock.sendMessage(from, { text: '⏳ Buscando el video... aguanta.' }, { quoted: m });

            let res = await axios.get(`https://sylphyy.xyz/download/igstory?url=${encodeURIComponent(query)}&api_key=${apiKey}`);
            let results = res.data.result || res.data.data || [];

            if (!results || results.length === 0) {
                const res2 = await axios.get(`https://a-s-s-u.vercel.app/api/download/instagram?url=${encodeURIComponent(query)}`);
                results = res2.data.result || res2.data.data || [];
            }

            if (!results || results.length === 0) {
                return await sock.sendMessage(from, { text: '❌ No hallé nada en este link.' });
            }

            const videoLinks = results.filter(item => {
                let link = String(item.url || item.dl_url || item).toLowerCase();
                return link.includes('mp4') || (link.includes('video') && !link.includes('.jpg'));
            });

            if (videoLinks.length === 0) {
                return await sock.sendMessage(from, { text: '⚠️ El link no contiene videos (parece ser solo una foto).' });
            }

            for (let videoItem of videoLinks) {
                let dlUrl = videoItem.url || videoItem.dl_url || videoItem;
                
                const response = await axios.get(dlUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data, 'binary');

                await sock.sendMessage(from, { 
                    video: buffer, 
                    caption: `✅ *Instagram Video*`,
                    mimetype: 'video/mp4',
                    fileName: `ig_video_${Date.now()}.mp4`
                }, { quoted: m });
            }
        } catch (e) {
            console.error("ERROR EN IG:", e.message);
            await sock.sendMessage(from, { text: '❌ Hubo un error al procesar el video. Intenta de nuevo.' });
        }
    }
};
