import axios from "axios";
import FormData from "form-data";

export default {
    name: "removebg",
    category: 'tools',
    aliases: ["rbg", "quitarfondo"],
    run: async (sock, m, from, text, quoted, args) => {
        // Mejoramos la detección del objeto de mensaje
        const q = m.quoted ? m.quoted : m;
        
        // Intentamos obtener el mimetype de varias fuentes posibles en el objeto
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        console.log("DEBUG RBG: Mimetype detectado ->", mime);

        // Si no detecta imagen, forzamos un log para ver qué objeto está recibiendo
        if (!/image/.test(mime)) {
            console.log("DEBUG RBG: No se detectó imagen. Objeto recibido:", JSON.stringify(q, null, 2));
            return;
        }

        try {
            console.log("DEBUG RBG: Descargando media...");
            // Usamos una descarga más robusta
            const media = await q.download?.() || await sock.downloadMediaMessage(q);
            
            if (!media) {
                console.log("DEBUG RBG: Error al descargar el archivo (Buffer vacío)");
                return;
            }

            console.log("DEBUG RBG: Media descargada. Tamaño:", media.length);

            const key = "sasuke";

            // 1. Subir para obtener URL
            const form = new FormData();
            form.append('file', media, { filename: 'image.png', contentType: mime });

            const uploadRes = await axios.post(`https://api.evogb.org/tools/upload?key=${key}`, form, {
                headers: { ...form.getHeaders() }
            });

            console.log("DEBUG RBG: Respuesta uploader:", uploadRes.data);

            const imgUrl = uploadRes.data.url || uploadRes.data.result || uploadRes.data.data?.url;
            
            if (!imgUrl) {
                console.log("DEBUG RBG: No se encontró URL en la respuesta");
                return;
            }

            // 2. Procesar Remove Background
            const urlFinal = `https://api.evogb.org/tools/removebg?url=${encodeURIComponent(imgUrl)}&key=${key}`;
            const response = await axios.get(urlFinal, { responseType: 'arraybuffer' });

            // 3. Enviar
            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

            console.log("DEBUG RBG: ¡Éxito total!");

        } catch (e) {
            console.error("--- ERROR EN EJECUCIÓN ---");
            console.error(e.stack); // Usamos stack para ver exactamente en qué línea falló
        }
    }
};
