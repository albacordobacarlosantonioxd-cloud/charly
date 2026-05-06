import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
    name: "removebg",
    category: 'tools',
    aliases: ["rbg", "quitarfondo"],
    run: async (sock, m, from, text, quoted, args) => {
        // Usamos la misma lógica de detección que te funcionó en nanobanana
        const q = m.quoted ? m.quoted.message : m.message;
        const imageMsg = q.imageMessage || q.viewOnceMessage?.message?.imageMessage || q.viewOnceMessageV2?.message?.imageMessage;

        if (!imageMsg) return; // Salida silenciosa si no hay imagen

        try {
            const key = "sasuke";

            // 1. Descargar imagen de WhatsApp (Copiado de tu código funcional)
            console.log("--- STEP 1: Descargando imagen para RemoveBG ---");
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 2. Subir a Uploader
            console.log("--- STEP 2: Subiendo a Uploader ---");
            const form = new FormData();
            form.append('file', buffer, { filename: 'image.jpg' });
            
            const uploadRes = await axios.post('https://api.evogb.org/tools/upload', form, {
                headers: { ...form.getHeaders() }
            });
            
            const directUrl = uploadRes.data.result || uploadRes.data.url;
            console.log("🔗 Enlace generado para RBG:", directUrl);

            if (!directUrl) return;

            // 3. Petición a Remove Background
            console.log("--- STEP 3: Quitando fondo ---");
            const urlFinal = `https://api.evogb.org/tools/removebg?url=${encodeURIComponent(directUrl)}&key=${key}`;
            
            const response = await axios.get(urlFinal, { 
                responseType: 'arraybuffer',
                timeout: 60000 // 60 segundos por si la imagen es pesada
            });

            // 4. Enviar resultado (Sin texto ni emojis como pediste)
            console.log("--- STEP 4: Enviando resultado a WA ---");
            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

        } catch (e) {
            console.error("--- ERROR EN REMOVEBG ---");
            console.error(e.message);
        }
    }
};
