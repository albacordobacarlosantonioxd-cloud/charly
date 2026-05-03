import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
    name: "nanobanana",
    category: 'ia',
    aliases: ["nb"],
    run: async (sock, m, from, text, quoted, args) => {
        const q = m.quoted ? m.quoted.message : m.message;
        const imageMsg = q.imageMessage || q.viewOnceMessage?.message?.imageMessage || q.viewOnceMessageV2?.message?.imageMessage;

        if (!imageMsg) return sock.sendMessage(from, { text: "Responde a una imagen, Carlos." });
        if (!text) return sock.sendMessage(from, { text: "Dime qué cambio le hago a la imagen." });

        try {
            const key = "sasuke";

            // 1. Descargar imagen de WhatsApp
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Subir a Uploader (Captura image_50e5f6.png)
            const form = new FormData();
            form.append('file', buffer, { filename: 'image.jpg' });
            
            const uploadRes = await axios.post('https://api.evogb.org/tools/upload', form, {
                headers: { ...form.getHeaders() }
            });
            
            // Verificamos el enlace que nos da el uploader
            const directUrl = uploadRes.data.result || uploadRes.data.url;
            console.log("🔗 Enlace generado:", directUrl); // Revisa esto en tu terminal

            if (!directUrl) return sock.sendMessage(from, { text: "No se pudo subir la imagen." });

            // 3. Petición a Nano Banana (Captura image_5143b5.png)
            // Agregamos un timeout para que no se quede colgado tu i3
            const response = await axios.get('https://api.evogb.org/ai/nanobanana', {
                params: {
                    prompt: text,
                    url: directUrl,
                    key: key
                },
                timeout: 60000 // 60 segundos
            });

            const imagenResultado = response.data.result || response.data.url;

            if (!imagenResultado) {
                return sock.sendMessage(from, { text: "La IA no devolvió imagen (Error 500 en el servidor)." });
            }

            await sock.sendMessage(from, { 
                image: { url: imagenResultado }
            }, { quoted: m });

        } catch (e) {
            // Si el error es 500, mostramos la respuesta del servidor en consola
            if (e.response) {
                console.error("DETALLE ERROR 500:", e.response.data);
            }
            console.error("ERROR NB:", e.message);
            await sock.sendMessage(from, { text: "Error 500: El servidor de Evo no pudo procesar esta imagen." });
        }
    }
};
