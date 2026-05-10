import fetch from "node-fetch";

export default {
    name: "nanobanana",
    category: 'ia',
    aliases: ["iaimg", "genimg", "imagine"],
    run: async (sock, m, from, text) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏"; 
        const key = "sasuke"; 

        if (!text) {
            return sock.sendMessage(from, { 
                text: `*🏮 [ SISTEMA CHARLY-BOT ]*\n\n*Escribe el prompt para generar la imagen.*` 
            }, { quoted: m });
        }

        await sock.sendMessage(from, { react: { text: '🧬', key: m.key } });

        try {
            const apiUrl = `https://api.evogb.org/ai/nanobanana?prompt=${encodeURIComponent(text)}&key=${key}`;
            
            // LOG: Ver que la URL se está armando bien
            console.log(`[DEBUG] Llamando a Nanobanana API: ${apiUrl}`);

            let res = await fetch(apiUrl);
            
            // LOG: Ver el estatus de la respuesta (200, 404, 500, etc)
            console.log(`[DEBUG] Status de la respuesta: ${res.status} ${res.statusText}`);

            if (!res.ok) {
                const errorText = await res.text();
                console.log(`[DEBUG] Error detallado de la API: ${errorText}`);
                throw new Error(`Error en la API: ${res.status}`);
            }

            const contentType = res.headers.get('content-type');
            console.log(`[DEBUG] Tipo de contenido recibido: ${contentType}`);

            let imageUrl;

            if (contentType && contentType.includes('application/json')) {
                let json = await res.json();
                console.log(`[DEBUG] JSON Recibido:`, JSON.stringify(json, null, 2));
                imageUrl = json.result; 
            } else {
                imageUrl = res.url; 
                console.log(`[DEBUG] URL Directa de imagen: ${imageUrl}`);
            }

            // Validación final de la URL
            if (!imageUrl) {
                console.log(`[DEBUG] Alerta: No se encontró imageUrl en la respuesta.`);
                throw new Error("No se obtuvo URL de imagen");
            }

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

            await sock.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: txt 
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✨', key: m.key } });

        } catch (error) {
            // LOG CRÍTICO: Aquí verás por qué falló el comando
            console.error("======== [ ERROR NANOBANANA ] ========");
            console.error("Mensaje:", error.message);
            console.error("Stack:", error.stack);
            console.error("======================================");

            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { 
                text: `🛑 *Error:* No se pudo renderizar la imagen.\n\n> *Detalle:* ${error.message}` 
            }, { quoted: m });
        }
    }
};
