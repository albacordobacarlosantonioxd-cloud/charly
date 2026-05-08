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

            const formData = new FormData();
            formData.append('image', buffer, { 
                filename: 'image.jpg', 
                contentType: 'image/jpeg' 
            });

            const apiKey = "sasuke";
            // Nota: Cambié el parámetro de 'apikey' a 'key' que es el estándar de EvoGB, 
            // y puse responseType: 'arraybuffer'
            const apiUrl = `https://api.evogb.org/tools/upscale?key=${apiKey}`;

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                responseType: 'arraybuffer', // CLAVE: Recibimos la imagen directamente
                timeout: 90000 
            });

            // Si la respuesta es exitosa, el buffer de la foto está en response.data
            if (response.data) {
                await sock.sendMessage(from, { 
                    image: Buffer.from(response.data), 
                    caption: '✅ *Calidad mejorada exitosamente.*',
                    mimetype: 'image/jpeg' 
                }, { quoted: m });
            } else {
                throw new Error('No se recibió contenido de imagen.');
            }

        } catch (err) {
            console.error("ERROR EN HD:", err);
            
            let msg = "Error al procesar la imagen.";
            if (err.response && err.response.data) {
                // Si falló y mandó un JSON de error en vez de la imagen
                try {
                    const errorJson = JSON.parse(err.response.data.toString());
                    msg = errorJson.message || msg;
                } catch (e) {
                    msg = "La API está saturada o el archivo es muy pesado.";
                }
            }
            
            sock.sendMessage(from, { text: `❌ Error: ${msg}` }, { quoted: m });
        }
    }
};
