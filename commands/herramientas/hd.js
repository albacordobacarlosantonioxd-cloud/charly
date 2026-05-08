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

            // Creamos el FormData
            const formData = new FormData();
            // Cambiamos 'image' por 'file' que es lo que suele pedir esta API
            formData.append('file', buffer, { 
                filename: 'image.jpg', 
                contentType: 'image/jpeg' 
            });

            const apiKey = "sasuke";
            const apiUrl = `https://api.evogb.org/tools/upscale?apikey=${apiKey}`;

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    // User-Agent de Chrome para que no nos bloqueen
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                responseType: 'arraybuffer', 
                timeout: 120000 // Aumentamos a 2 minutos por si la IA está lenta
            });

            if (response.data) {
                // Verificamos si lo que regresó es una imagen o un JSON de error camuflado
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
            // Si es un Error 500, es probable que la imagen sea muy grande o la API esté caída
            if (err.response?.status === 500) {
                return sock.sendMessage(from, { text: "❌ El servidor de la API tuvo un error interno (500). Intenta con una foto más pequeña o espera un momento." }, { quoted: m });
            }
            
            let msg = err.message || "Error desconocido";
            sock.sendMessage(from, { text: `❌ Error: ${msg}` }, { quoted: m });
        }
    }
};
