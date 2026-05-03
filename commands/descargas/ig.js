import axios from "axios";

export default {
    name: "instagram",
    category: 'descargas',
    aliases: ["ig", "insta", "reels"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text || !text.includes("instagram.com")) {
            return sock.sendMessage(from, { text: "Necesito un enlace de Instagram (Reel, Foto o Video)." });
        }

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/dl/instagram?url=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal);
            const res = response.data;

            // Manejo de la respuesta según la estructura de la API
            const data = res.result || res.data;

            if (!data || (Array.isArray(data) && data.length === 0)) {
                return sock.sendMessage(from, { text: "No pude encontrar contenido en ese enlace." });
            }

            // Si es un carrusel o lista de archivos, recorremos y enviamos
            const mediaList = Array.isArray(data) ? data : [data];

            for (const item of mediaList) {
                const mediaUrl = item.url || item.download || item;
                
                // Si es un video (Reel o Video de post)
                if (mediaUrl.includes(".mp4") || item.type === 'video') {
                    await sock.sendMessage(from, { 
                        video: { url: mediaUrl }, 
                        caption: `✅ *Instagram Downloader*` 
                    }, { quoted: m });
                } else {
                    // Si es una imagen
                    await sock.sendMessage(from, { 
                        image: { url: mediaUrl }, 
                        caption: `✅ *Instagram Downloader*` 
                    }, { quoted: m });
                }
            }

        } catch (e) {
            console.error("ERROR IG DL:", e.message);
            await sock.sendMessage(from, { text: "Hubo un error al conectar con el servidor de Instagram." });
        }
    }
};
