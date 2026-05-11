import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

export default {
    name: "hd",
    category: 'herramientas',
    // Usamos destructuración para recibir el paquete de herramientas
    run: async (sock, m, from, text, { usedPrefix, command }) => {
        try {
            // Usamos m.quoted que ya viene procesado del index.js
            const q = m.quoted ? m.quoted : m;
            const mime = (q.message || q).imageMessage;

            if (!mime) {
                return sock.sendMessage(from, { text: `❌ Responde a una imagen para mejorarla usando *${usedPrefix + command}*` }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Mejorando calidad... esto puede tardar unos segundos.*' }, { quoted: m });

            // Descargamos el contenido
            const stream = await downloadContentFromMessage(mime, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const formData = new FormData();
            formData.append('file', buffer, { 
                filename: 'image.jpg', 
                contentType: 'image/jpeg' 
            });

            const apiKey = "sasuke";
            const apiUrl = `https://api.evogb.org/tools/upscale?apikey=${apiKey}`;

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer', 
                timeout: 120000 
            });

            if (response.data) {
                const beginning = response.data.slice(0, 50).toString();
                if (beginning.includes('{"status":false') || beginning.includes('{"error"')) {
                    const errData = JSON.parse(response.data.toString());
                    throw new Error(errData.message || "La API falló al procesar.");
                }

                await sock.sendMessage(from, { 
                    image: Buffer.from(response.data), 
                    caption: '✅ *Calidad mejorada exitosamente.*',
                    mimetype: 'image/jpeg' 
                }, { quoted: m });
            }

        } catch (err) {
            console.error("--- DEBUG ERROR HD ---");
            if (err.response?.status === 500) {
                return sock.sendMessage(from, { text: "❌ El servidor de la API tuvo un error interno (500). Intenta más tarde." }, { quoted: m });
            }
            
            let msg = err.message || "Error desconocido";
            sock.sendMessage(from, { text: `❌ Error: ${msg}` }, { quoted: m });
        }
    }
};
