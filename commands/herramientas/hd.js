import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

export default {
    name: "hd",
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        try {
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message?.imageMessage;

            if (!isImage && !isQuotedImage) {
                return sock.sendMessage(from, { text: '❌ Responde a una imagen para mejorarla.' }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Mejorando calidad... esto puede tardar unos segundos.*' }, { quoted: m });

            const messageToDownload = isQuotedImage ? quoted.imageMessage : m.message.imageMessage;
            const stream = await downloadContentFromMessage(messageToDownload, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 1. Preparamos el FormData SOLO para el archivo
            const formData = new FormData();
            formData.append('file', buffer, { 
                filename: 'image.jpg', 
                contentType: 'image/jpeg' 
            });

            // 2. PASAMOS LA API KEY EN LA URL (Esto soluciona el error 401)
            const apiKey = "sasuke";
            const apiUrl = `https://api.evogb.org/tools/upscale?apikey=${apiKey}`;

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 60000 // 60 segundos
            });

            const data = response.data;
            
            // 3. Manejo de la respuesta (Dependiendo de cómo responda EvoGB)
            // Probamos varias rutas comunes de respuesta
            const finalImageUrl = data.result || data.url || data.data?.url || data.data;

            if (finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.startsWith('http')) {
                await sock.sendMessage(from, { 
                    image: { url: finalImageUrl }, 
                    caption: '✅ *Calidad mejorada exitosamente.*',
                    mimetype: 'image/jpeg' 
                }, { quoted: m });
            } else {
                console.log("Respuesta de la API:", data);
                throw new Error('La API no devolvió una URL de imagen válida.');
            }

        } catch (err) {
            console.error("ERROR EN HD:", err);
            
            // Capturar el mensaje de error exacto de la API si existe
            let msg = err.message;
            if (err.response && err.response.data) {
                msg = err.response.data.message || JSON.stringify(err.response.data);
            }
            
            sock.sendMessage(from, { text: `❌ Error: ${msg}` }, { quoted: m });
        }
    }
};
