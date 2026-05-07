import evogb from "../../lib/apiClient.js";
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
            console.log("--- STEP 1: Descargando imagen de WA ---");
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Subir a Uploader
            console.log("--- STEP 2: Subiendo a Evogb Uploader ---");
            const form = new FormData();
            form.append('file', buffer, { filename: 'image.jpg' });
            
            const uploadRes = await evogb.post('https://api.evogb.org/tools/upload', form, {
                headers: { ...form.getHeaders() }
            });
            
            const directUrl = uploadRes.data.result || uploadRes.data.url;
            console.log("🔗 Enlace generado:", directUrl);

            if (!directUrl) {
                console.error("❌ Falló el uploader, respuesta:", uploadRes.data);
                return sock.sendMessage(from, { text: "No se pudo subir la imagen al servidor temporal." });
            }

            // 3. Petición a Nano Banana
            console.log("--- STEP 3: Procesando con Nano Banana IA ---");
            const response = await evogb.get('https://api.evogb.org/ai/nanobanana', {
                params: {
                    prompt: text,
                    url: directUrl,
                    key: key
                },
                timeout: 90000 // Aumentamos a 90 seg para Railway
            });

            console.log("--- STEP 4: Respuesta de IA recibida ---");
            const imagenResultado = response.data.result || response.data.url;

            if (!imagenResultado) {
                console.error("❌ La IA no devolvió URL. Respuesta:", response.data);
                return sock.sendMessage(from, { text: "La IA no devolvió imagen (Posible error interno de la API)." });
            }

            await sock.sendMessage(from, { 
                image: { url: imagenResultado },
                caption: "✅ ¡Listo! Aquí tienes tu imagen editada."
            }, { quoted: m });

        } catch (e) {
            console.error("--- ERROR NANOBANANA DETALLADO ---");
            if (e.response) {
                // El servidor respondió con error (ej. 500, 403, 404)
                console.error("Fase: Petición HTTP");
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
                
                let msgError = e.response.status === 500 
                    ? "Error 500: El servidor de Evo colapsó procesando la imagen." 
                    : `Error de API: ${e.response.status}`;
                await sock.sendMessage(from, { text: msgError });
            } else if (e.code === 'ECONNABORTED') {
                console.error("Error: Tiempo de espera agotado (Timeout)");
                await sock.sendMessage(from, { text: "La IA tardó demasiado en responder. Reintenta en un momento." });
            } else {
                console.error("Mensaje:", e.message);
                await sock.sendMessage(from, { text: `Error inesperado: ${e.message}` });
            }
        }
    }
};
