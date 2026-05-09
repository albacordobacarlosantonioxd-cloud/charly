import fetch from "node-fetch";

export default {
    name: "nanobanana",
    category: 'ia',
    aliases: ["iaimg", "genimg", "imagine"],
    run: async (sock, m, from, text) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏"; // <--- Actualizado
        
        // Key oficial de la API de EvoGB
        const key = "sasuke"; 

        if (!text) {
            return sock.sendMessage(from, { 
                text: `*🏮 [ SISTEMA CHARLY-BOT ]*\n\n*Escribe el prompt para generar la imagen.*\n*Ejemplo:* .nanobanana una Yamaha MT-09 modificada color negro mate` 
            }, { quoted: m });
        }

        // Reacción de procesamiento (ADN/Carga)
        await sock.sendMessage(from, { react: { text: '🧬', key: m.key } });

        try {
            const apiUrl = `https://api.evogb.org/ai/nanobanana?prompt=${encodeURIComponent(text)}&key=${key}`;
            let res = await fetch(apiUrl);
            
            if (!res.ok) throw new Error("Error en la API");

            const contentType = res.headers.get('content-type');
            let imageUrl;

            // Manejo dinámico de respuesta (JSON o URL directa)
            if (contentType && contentType.includes('application/json')) {
                let json = await res.json();
                imageUrl = json.result;
            } else {
                imageUrl = res.url; 
            }

            // Diseño de la interfaz del mensaje
            let txt = `┏━━━━━━━━━━━━━━━━━━┓\n`;
            txt += `┃  🏮  *CHARLY-BOT VISION* 🏮\n`;
            txt += `┣━━━━━━━━━━━━━━━━━━┛\n`;
            txt += `┃\n`;
            txt += `┃ 📝 *Dᴇsᴄʀɪᴘᴄɪᴏ́ɴ:* \n`;
            txt += `┃ » _${text}_ \n`;
            txt += `┃\n`;
            txt += `┃ ⚙️ *Esᴛᴀᴅᴏ:* 🟢 Finalizado\n`;
            txt += `┃ 🧪 *Mᴏᴅᴇʟᴏ:* Nanobanana v3\n`;
            txt += `┃\n`;
            txt += `┣━━━━━━━━━━━━━━━━━━┓\n`;
            txt += `┃ ⚡ *${dev}*\n`;
            txt += `┃ 📡 *${chn}*\n`;
            txt += `┗━━━━━━━━━━━━━━━━━━┛`;

            // Enviamos el resultado al chat
            await sock.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: txt 
            }, { quoted: m });

            // Reacción de éxito
            await sock.sendMessage(from, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error("Error en Nanobanana:", error);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 *Error:* No se pudo renderizar la imagen en CHARLY-BOT.' }, { quoted: m });
        }
    }
};
