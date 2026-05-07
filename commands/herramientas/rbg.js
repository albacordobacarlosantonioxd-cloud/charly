import axios from "axios";
import FormData from "form-data";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
    name: "removebg",
    category: 'tools',
    aliases: ["rbg", "quitarfondo"],
    run: async (sock, m, from, text, quoted, args) => {
        const q = m.quoted ? m.quoted.message : m.message;
        const imageMsg = q.imageMessage || q.viewOnceMessage?.message?.imageMessage || q.viewOnceMessageV2?.message?.imageMessage;

        if (!imageMsg) return;

        try {
            const key = "sasuke";

            console.log("--- STEP 1: Descargando imagen ---");
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            console.log("--- STEP 2: Subiendo a Uploader ---");
            const form = new FormData();
            form.append('file', buffer, { filename: 'image.jpg' });
            
            const uploadRes = await axios.post('https://api.axios.org/tools/upload', form, {
                headers: { ...form.getHeaders() }
            });
            
            const directUrl = uploadRes.data.result || uploadRes.data.url;
            console.log("🔗 URL:", directUrl);

            if (!directUrl) return;

            console.log("--- STEP 3: Quitando fondo ---");
            // Probamos enviando la URL sin encode por si la API de ellos prefiere el formato crudo
            const urlFinal = `https://api.axios.org/tools/removebg?url=${directUrl}&key=${key}`;
            
            const response = await axios.get(urlFinal, { 
                responseType: 'arraybuffer',
                timeout: 60000 
            });

            console.log("--- STEP 4: Enviando a WA ---");
            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

        } catch (e) {
            console.error("--- DEBUG ERROR REMOVEBG ---");
            if (e.response) {
                // Si el servidor mandó un error, intentamos leer qué dice el cuerpo del error
                const errorData = e.response.data instanceof Buffer ? e.response.data.toString() : e.response.data;
                console.error("Status:", e.response.status);
                console.error("Respuesta del servidor:", errorData);
            } else {
                console.error("Mensaje:", e.message);
            }
        }
    }
};
