import axios from 'axios';

export default {
    name: "socialdl",
    category: 'descargas',
    aliases: ["ig", "instagram", "fb", "facebook", "tk", "tiktok"],
    run: async (sock, m, from, text, command) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";
        
        // Usamos la query del texto o de un mensaje citado
        let query = text ? text.trim() : (m.quoted?.text || null);
        
        if (!query) {
            return sock.sendMessage(from, { 
                text: `✨ *Ingresa un enlace para descargar*\n\n> *Ejemplo:* .${command} https://www.instagram.com/reel/...` 
            }, { quoted: m });
        }

        // Reacción de espera
        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

try {
            const key = "sasuke"; 
            let endpoint = '';

            // Usamos un Switch o Ifs más claros para evitar el string vacío
            if (/ig|instagram/i.test(command)) {
                endpoint = `https://api.evogb.org/dl/instagram?url=${encodeURIComponent(query)}&key=${key}`;
            } else if (/fb|facebook/i.test(command)) {
                endpoint = `https://api.evogb.org/dl/facebook?url=${encodeURIComponent(query)}&key=${key}`;
            } else if (/tk|tiktok/i.test(command)) {
                endpoint = `https://api.evogb.org/dl/tiktok?url=${encodeURIComponent(query)}&key=${key}`;
            }

            // VALIDACIÓN CRÍTICA: Si el endpoint sigue vacío, no disparamos Axios
            if (!endpoint) {
                return sock.sendMessage(from, { text: '⚠️ Comando no reconocido para esta descarga.' }, { quoted: m });
            }

            // Ahora sí hacemos la petición
            const { data } = await axios.get(endpoint);
            
            if (!data.status) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '⚠️ *La API no devolvió un resultado válido.*' }, { quoted: m });
            }

            let downloadUrl = '';
            let title = 'Archivo Multimedia';

            // Extracción de datos según la red social
            if (/ig|instagram/i.test(command)) {
                downloadUrl = data.data[0].url;
                title = 'Instagram Reel';
            } else if (/fb|facebook/i.test(command)) {
                downloadUrl = data.resultados[0].url;
                title = 'Facebook Video';
            } else if (/tk|tiktok/i.test(command)) {
                downloadUrl = data.data.dl;
                title = data.data.title || 'TikTok Video';
            }

            if (!downloadUrl) {
                throw new Error("No se encontró URL de descarga");
            }

            // Interfaz de usuario (UI) adaptada
            let ui = `┏━━━━━━━━━━━━━━━━┓\n`;
            ui += `┃   📥 *DESCARGADOR* ┃\n`;
            ui += `┗━━━━━━━━━━━━━━━━┛\n\n`;
            ui += `📝 *INFO:* ${title}\n`;
            ui += `🔗 *ORIGEN:* ${command.toUpperCase()}\n\n`;
            ui += `━━━━━━━━━━━━━━━━━━━━\n`;
            ui += `⚡ *${dev}*\n`;
            ui += `🌐 *${chn}*`;

            // Envío del video
            await sock.sendMessage(from, { 
                video: { url: downloadUrl }, 
                caption: ui,
                mimetype: 'video/mp4'
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error en SocialDL:", e);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '⚠️ *Ocurrió un error al procesar el video. Verifica el enlace.*' }, { quoted: m });
        }
    }
};
