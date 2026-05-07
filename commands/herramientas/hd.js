import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

export default {
    name: "hd",
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        try {
            // 1. Verificar si hay una imagen (en el mensaje o en el citado)
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message?.imageMessage;

            if (!isImage && !isQuotedImage) {
                return sock.sendMessage(from, { text: '❌ Responde a una imagen para mejorarla.' }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Mejorando calidad... esto puede tardar de 5 a 15 segundos.*' }, { quoted: m });

            // 2. Descargar la imagen del mensaje de WhatsApp
            const messageToDownload = isQuotedImage ? quoted.imageMessage : m.message.imageMessage;
            const stream = await downloadContentFromMessage(messageToDownload, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 3. Preparar el envío directo a la API evogb.org
            const formData = new FormData();
            formData.append('apikey', 'sasuke'); // Tu API Key
            formData.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

            // Realizamos la petición POST enviando el buffer directamente
            const response = await axios.post('https://api.evogb.org/tools/upscale', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000 // 30 segundos de espera
            });

            // 4. Procesar la respuesta de la API
            // La mayoría de estas APIs devuelven un JSON con un campo 'result' o 'url'
            const data = response.data;
            const finalImageUrl = data.result || data.url || data.data?.url;

            if (finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.startsWith('http')) {
                await sock.sendMessage(from, { 
                    image: { url: finalImageUrl }, 
                    caption: '✅ *Calidad mejorada exitosamente con EvoGB.*',
                    mimetype: 'image/jpeg' 
                }, { quoted: m });
            } else {
                console.log("Respuesta API inesperada:", data);
                throw new Error('La API no devolvió un enlace de imagen válido.');
            }

        } catch (err) {
            console.error("ERROR EN HD:", err);
            const errorMessage = err.response?.data?.message || err.message;
            sock.sendMessage(from, { text: `❌ Fallo: ${errorMessage}` }, { quoted: m });
        }
    }
};
