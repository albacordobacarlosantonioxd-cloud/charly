import axios from "axios";

export default {
    name: "instagram",
    category: 'descargas',
    aliases: ["ig", "insta", "reels"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text || !text.includes("instagram.com")) {
            return sock.sendMessage(from, { text: "Necesito un enlace de Instagram (Reel, Foto o Video), Carlos." });
        }

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/dl/instagram?url=${encodeURIComponent(text)}&key=${key}`;

            // Reacción de espera
            await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

            console.log("--- DEBUG INSTAGRAM DL ---");
            console.log("Procesando link:", text);

            const response = await axios.get(urlFinal, { timeout: 60000 });
            
            // Log para ver si la API devuelve un objeto único o un array (carrusel)
            console.log("Respuesta API Instagram:", JSON.stringify(response.data).slice(0, 300) + "...");

            const res = response.data;
            const data = res.result || res.data;

            if (!data || (Array.isArray(data) && data.length === 0)) {
                console.error("❌ No se encontró contenido multimedia.");
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                return sock.sendMessage(from, { text: "No pude encontrar contenido en ese enlace. Puede que la cuenta sea privada." });
            }

            // Convertimos a array siempre para manejar carruseles y archivos únicos con la misma lógica
            const mediaList = Array.isArray(data) ? data : [data];

            for (const item of mediaList) {
                // Buscamos la URL en diferentes propiedades según lo que mande la API
                const mediaUrl = item.url || item.download || (typeof item === 'string' ? item : null);
                
                if (!mediaUrl) continue;

                console.log("🚀 Enviando archivo:", mediaUrl.split('?')[0]);

                // Detectamos si es video por la extensión o el tipo que declare la API
                const isVideo = mediaUrl.includes(".mp4") || item.type === 'video' || item.isVideo;

                if (isVideo) {
                    await sock.sendMessage(from, { 
                        video: { url: mediaUrl }, 
                        caption: `✅ *Instagram Downloader*` 
                    }, { quoted: m });
                } else {
                    await sock.sendMessage(from, { 
                        image: { url: mediaUrl }, 
                        caption: `✅ *Instagram Downloader*` 
                    }, { quoted: m });
                }
            }

            // Reacción de éxito
            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

        } catch (e) {
            console.error("--- ERROR IG DL DETALLADO ---");
            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });

            if (e.response) {
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
            } else {
                console.error("Mensaje:", e.message);
            }
            
            await sock.sendMessage(from, { text: "Hubo un error al conectar con el servidor de Instagram o el link es inválido." });
        }
    }
};
