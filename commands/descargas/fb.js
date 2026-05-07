import axios from "axios";

export default {
    name: "facebook",
    category: 'descargas',
    aliases: ["fb", "fbdl"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text || (!text.includes("facebook.com") && !text.includes("fb.watch"))) {
            return sock.sendMessage(from, { text: "Necesito un enlace de video de Facebook." });
        }

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.axios.org/dl/facebook?url=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal);
            const res = response.data;
            const data = res.result || res.data;

            if (!data) return sock.sendMessage(from, { text: "No pude encontrar el video en ese enlace." });

            // Seleccionamos la mejor calidad disponible (HD primero, luego SD)
            const videoUrl = data.hd || data.sd || data.url || (Array.isArray(data) ? data[0].url : null);

            if (!videoUrl) {
                return sock.sendMessage(from, { text: "No se encontró un link de descarga válido." });
            }

            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: `🎬 *Facebook Downloader*\n\n_Calidad: ${data.hd ? 'HD' : 'SD'}_` 
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR FB DL:", e.message);
            await sock.sendMessage(from, { text: "Error al conectar con el servidor de Facebook." });
        }
    }
};
