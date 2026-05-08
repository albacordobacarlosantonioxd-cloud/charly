import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

export default {
    name: "toreal",
    category: 'ia',
    aliases: ["realista", "animetoreal"],
    run: async (sock, m, from, text, quoted) => {
        try {
            // Verificamos si hay una imagen
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message?.imageMessage;

            if (!isImage && !isQuotedImage) {
                return sock.sendMessage(from, { text: '❌ Responde a una imagen de anime para convertirla a realista.' }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Transformando a estilo realista... esto puede tardar unos segundos.*' }, { quoted: m });

            // Descargamos la imagen
            const messageToDownload = isQuotedImage ? quoted.imageMessage : m.message.imageMessage;
            const stream = await downloadContentFromMessage(messageToDownload, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Preparamos el FormData
            const formData = new FormData();
            formData.append('file', buffer, { 
                filename: 'anime_image.jpg', 
                contentType: 'image/jpeg' 
            });
            formData.append('method', 'local'); // Según el parámetro de la imagen que pasaste

            const apiKey = "sasuke";
            const apiUrl = `https://api.evogb.org/ai/toreal?key=${apiKey}`;

            // Hacemos la petición
            const response = await axios.post(apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0'
                },
                responseType: 'arraybuffer', // Para recibir la imagen directamente
                timeout: 120000 
            });

            if (response.data) {
                // Verificamos que no sea un JSON de error camuflado
                const beginning = response.data.slice(0, 50).toString();
                if (beginning.includes('{"status":false')) {
                    throw new Error("La API no pudo procesar esta imagen.");
                }

                await sock.sendMessage(from, { 
                    image: Buffer.from(response.data), 
                    caption: '✨ *Aquí tienes tu versión realista.*',
                    mimetype: 'image/jpeg' 
                }, { quoted: m });
            }

        } catch (err) {
            console.error("ERROR EN TOREAL:", err);
            let msg = "Error al transformar la imagen.";
            if (err.response?.status === 500) {
                msg = "El servidor de la IA está saturado, intenta en un momento.";
            }
            sock.sendMessage(from, { text: `❌ Error: ${msg}` }, { quoted: m });
        }
    }
};
