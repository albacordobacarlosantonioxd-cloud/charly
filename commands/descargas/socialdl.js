import axios from 'axios';

export default {
    name: "socialdl",
    category: 'descargas',
    // Asegúrate de que estos alias coincidan con los que usas en el menú
    aliases: ["ig", "instagram", "fb", "facebook", "tk", "tiktok"],
    run: async (sock, m, from, text, command) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";
        
        // Limpiamos el comando de cualquier punto o espacio extra
        const cmd = command.replace('.', '').toLowerCase();
        
        let query = text ? text.trim() : (m.quoted?.text || null);
        
        if (!query) {
            return sock.sendMessage(from, { 
                text: `✨ *Ingresa un enlace para descargar*\n\n> *Ejemplo:* .${cmd} https://www.instagram.com/reel/...` 
            }, { quoted: m });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const key = "sasuke"; 
            let endpoint = '';

            // Usamos la variable 'cmd' que ya está limpia
            if (cmd === 'ig' || cmd === 'instagram') {
                endpoint = `https://api.evogb.org/dl/instagram?url=${encodeURIComponent(query)}&key=${key}`;
            } else if (cmd === 'fb' || cmd === 'facebook') {
                endpoint = `https://api.evogb.org/dl/facebook?url=${encodeURIComponent(query)}&key=${key}`;
            } else if (cmd === 'tk' || cmd === 'tiktok') {
                endpoint = `https://api.evogb.org/dl/tiktok?url=${encodeURIComponent(query)}&key=${key}`;
            }

            // Si por alguna razón el endpoint sigue vacío
            if (!endpoint) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: `⚠️ El comando *${cmd}* no está configurado correctamente en el sistema.` }, { quoted: m });
            }

            const { data } = await axios.get(endpoint);
            
            if (!data.status) {
                throw new Error("API Status False");
            }

            let downloadUrl = '';
            let title = 'Archivo Multimedia';

            if (cmd === 'ig' || cmd === 'instagram') {
                downloadUrl = data.data[0].url;
                title = 'Instagram Reel';
            } else if (cmd === 'fb' || cmd === 'facebook') {
                downloadUrl = data.resultados[0].url;
                title = 'Facebook Video';
            } else if (cmd === 'tk' || cmd === 'tiktok') {
                downloadUrl = data.data.dl;
                title = data.data.title || 'TikTok Video';
            }

            let ui = `┏━━━━━━━━━━━━━━━━┓\n┃   📥 *DESCARGADOR* ┃\n┗━━━━━━━━━━━━━━━━┛\n\n📝 *INFO:* ${title}\n⚡ *${dev}*\n🌐 *${chn}*`;

            await sock.sendMessage(from, { 
                video: { url: downloadUrl }, 
                caption: ui,
                mimetype: 'video/mp4'
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error en SocialDL:", e);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '⚠️ *Error:* No se pudo obtener el video. Revisa que el enlace sea público.' }, { quoted: m });
        }
    }
};
