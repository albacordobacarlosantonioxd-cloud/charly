import axios from "axios";
import FormData from "form-data";

export default {
    name: "removebg",
    category: 'tools',
    aliases: ["rbg", "quitarfondo"],
    run: async (sock, m, from, text, quoted, args) => {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!/image/.test(mime)) {
            console.log("DEBUG RBG: El archivo no es una imagen o no hay nada");
            return;
        }

        try {
            console.log("DEBUG RBG: Descargando media de WhatsApp...");
            const media = await q.download();
            console.log("DEBUG RBG: Media descargada. Tamaño:", media.length, "bytes");

            const key = "sasuke";

            // 1. Subir para obtener URL
            console.log("DEBUG RBG: Intentando subir al uploader...");
            const form = new FormData();
            form.append('file', media, { filename: 'image.png' });

            const uploadRes = await axios.post(`https://api.evogb.org/tools/upload?key=${key}`, form, {
                headers: { ...form.getHeaders() }
            });

            console.log("DEBUG RBG: Respuesta uploader:", uploadRes.data);

            const imgUrl = uploadRes.data.url || uploadRes.data.result;
            if (!imgUrl) {
                console.log("DEBUG RBG: No se obtuvo URL del uploader");
                return;
            }
            console.log("DEBUG RBG: URL obtenida:", imgUrl);

            // 2. Procesar Remove Background
            const urlFinal = `https://api.evogb.org/tools/removebg?url=${encodeURIComponent(imgUrl)}&key=${key}`;
            console.log("DEBUG RBG: Llamando a removebg...");

            const response = await axios.get(urlFinal, { 
                responseType: 'arraybuffer',
                timeout: 30000 // Le damos 30s porque procesar imágenes cansa al servidor
            });

            console.log("DEBUG RBG: Respuesta de removebg recibida. Status:", response.status);

            // 3. Enviar la imagen
            if (response.data) {
                console.log("DEBUG RBG: Enviando imagen a WhatsApp...");
                await sock.sendMessage(from, { 
                    image: Buffer.from(response.data)
                }, { quoted: m });
                console.log("DEBUG RBG: ¡Enviado!");
            }

        } catch (e) {
            console.error("--- ERROR ESPECÍFICO EN REMOVEBG ---");
            if (e.response) {
                // El servidor respondió con error (403, 500, etc)
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data.toString());
            } else {
                console.error("Mensaje de error:", e.message);
            }
        }
    }
};
