import axios from "axios";
import FormData from "form-data";

export default {
    name: "removebg",
    category: 'tools',
    aliases: ["rbg", "quitarfondo"],
    run: async (sock, m, from, text, quoted, args) => {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!/image/.test(mime)) return;

        try {
            const media = await q.download();
            const key = "sasuke";

            // 1. Subir para obtener URL
            const form = new FormData();
            form.append('file', media, { filename: 'image.png' });

            const uploadRes = await axios.post(`https://api.evogb.org/tools/upload?key=${key}`, form, {
                headers: { ...form.getHeaders() }
            });

            const imgUrl = uploadRes.data.url || uploadRes.data.result;
            if (!imgUrl) return;

            // 2. Procesar Remove Background
            const urlFinal = `https://api.evogb.org/tools/removebg?url=${encodeURIComponent(imgUrl)}&key=${key}`;
            const response = await axios.get(urlFinal, { responseType: 'arraybuffer' });

            // 3. Enviar solo la imagen
            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

        } catch (e) {
            console.error("Error silencioso en RemoveBG:", e.message);
        }
    }
};
