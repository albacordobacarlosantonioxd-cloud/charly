import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
    name: "comprimir",
    category: 'tools',
    aliases: ["compress", "compressor"],
    run: async (sock, m, from, text, quoted, args) => {
        // 1. Validar si hay una imagen (en el mensaje o en el mensaje citado)
        const q = m.quoted ? m.quoted.message : m.message;
        const imageMsg = q.imageMessage || q.viewOnceMessage?.message?.imageMessage || q.viewOnceMessageV2?.message?.imageMessage;

        if (!imageMsg) {
            return sock.sendMessage(from, { text: "❌ Por favor, responde a una imagen o envía una imagen con el comando." });
        }

        try {
            const key = "sasuke"; // Tu API Key
            
            // 2. Descargar la imagen de WhatsApp a un Buffer
            console.log("--- STEP 1: Descargando imagen de WA ---");
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 3. Subir la imagen al Uploader de EvoGB para obtener una URL
            console.log("--- STEP 2: Subiendo a Uploader ---");
            const form = new FormData();
            form.append('file', buffer, { filename: 'whatsapp_img.jpg' });
            form.append('server', 'Automatic');
            form.append('method', 'Local (Subir archivo)');

            // Enviamos la key en la URL para asegurar acceso
            const uploadRes = await axios.post(`https://api.evogb.org/tools/upload?apikey=${key}`, form, {
                headers: { ...form.getHeaders() }
            });

            const directUrl = uploadRes.data.result || uploadRes.data.url;

            if (!directUrl) {
                throw new Error("El uploader no devolvió una URL válida.");
            }
            console.log("🔗 URL temporal generada:", directUrl);

            // 4. Enviar la URL al compresor
            console.log("--- STEP 3: Comprimiendo imagen ---");
            // El nivel puede ser: low, medium, high. Usamos 'medium' para WhatsApp.
            const compressRes = await axios.get('https://api.evogb.org/tools/compress-image', {
                params: {
                    apikey: key,
                    method: 'url',
                    url: directUrl,
                    level: 'medium' 
                }
            });

            const compressedUrl = compressRes.data.result || compressRes.data.url;

            if (!compressedUrl) {
                throw new Error("El compresor no devolvió una URL de imagen.");
            }
            console.log("✨ Imagen comprimida exitosamente.");

            // 5. Enviar la imagen final al usuario
            await sock.sendMessage(from, { 
                image: { url: compressedUrl },
                caption: "✅ *Imagen comprimida para WhatsApp*\n\nOptimizado para ahorrar datos sin perder calidad visual."
            }, { quoted: m });

        } catch (e) {
            console.error("--- ERROR COMPRESOR DETALLADO ---");
            if (e.response) {
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
                await sock.sendMessage(from, { text: `❌ Error de API: ${e.response.status}. El servidor no pudo procesar la imagen.` });
            } else {
                console.error("Mensaje:", e.message);
                await sock.sendMessage(from, { text: `❌ Error inesperado: ${e.message}` });
            }
        }
    }
};
