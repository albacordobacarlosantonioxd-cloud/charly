import axios from 'axios';

export default {
    name: "mediafire",
    category: 'descargas',
    aliases: ["mf"],
    run: async (sock, m, from, text) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";
        
        let query = text ? text.trim() : (m.quoted?.text || null);
        
        if (!query || !query.includes('mediafire.com')) {
            return sock.sendMessage(from, { 
                text: `✨ *Ingresa un enlace válido de MediaFire*\n\n> *Ejemplo:* .mediafire https://www.mediafire.com/file/...` 
            }, { quoted: m });
        }

        // Reacción de inicio de descarga
        await sock.sendMessage(from, { react: { text: '📥', key: m.key } });

        try {
            const key = "sasuke"; // Key directa para CHARLY-BOT
            const { data } = await axios.get(`https://api.evogb.org/dl/mediafire?url=${encodeURIComponent(query)}&key=${key}`);

            if (!data.status || !data.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '⚠️ *No se pudo obtener el archivo. Verifica el enlace.*' }, { quoted: m });
            }

            const fileData = data.data;

            // Diseño de la interfaz adaptada
            let ui = `┏━━━━━━━━━━━━━━━━┓\n`;
            ui += `┃   📦 *MEDIAFIRE DL* ┃\n`;
            ui += `┗━━━━━━━━━━━━━━━━┛\n\n`;
            ui += `📄 *NOMBRE:* ${fileData.name}\n`;
            ui += `⚖️ *PESO:* ${fileData.size}\n`;
            ui += `📁 *TIPO:* ${fileData.type}\n\n`;
            ui += `━━━━━━━━━━━━━━━━━━━━\n`;
            ui += `⚡ *${dev}*\n`;
            ui += `🌐 *${chn}*`;

            // Determinamos el mimetype de forma más precisa
            let mime = 'application/octet-stream';
            if (fileData.name.endsWith('.apk')) mime = 'application/vnd.android.package-archive';
            if (fileData.name.endsWith('.zip')) mime = 'application/zip';
            if (fileData.name.endsWith('.pdf')) mime = 'application/pdf';

            // Enviamos el documento aprovechando tus 48 vCPUs para el streaming
            await sock.sendMessage(from, { 
                document: { url: fileData.dl }, 
                fileName: fileData.name, 
                mimetype: mime,
                caption: ui
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error en MediaFire DL:", e);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '⚠️ *Error al conectar con los servidores de MediaFire.*' }, { quoted: m });
        }
    }
};
