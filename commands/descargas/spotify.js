import axios from "axios";

export default {
    name: "spotify",
    category: 'descargas',
    aliases: ["sp", "sps"],
    run: async (sock, m, from, text, quoted, args) => {
        // Validamos que el usuario mande un link
        if (!text || !text.includes("spotify.com")) {
            return sock.sendMessage(from, { text: "Pega un enlace de Spotify para descargar la música." });
        }

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/dl/spotify?url=${encodeURIComponent(text)}&key=${key}`;

            console.log("--- DEBUG SPOTIFY DL ---");
            console.log("Descargando link:", text);

            // Aumentamos el timeout a 60 segundos porque las descargas tardan
            const response = await axios.get(urlFinal, { timeout: 60000 });
            
            // Log para ver qué campos trae el resultado
            console.log("Respuesta API Spotify DL:", JSON.stringify(response.data).slice(0, 250) + "...");

            const data = response.data.result || response.data.data;

            if (!data) {
                console.error("❌ No se encontraron datos en la respuesta de la API");
                return sock.sendMessage(from, { text: "No pude obtener el archivo de Spotify, checa el link." });
            }

            // Detectamos la URL de descarga (probamos varios nombres comunes)
            const downloadUrl = data.url || data.dl_url || data.download || data.link;

            if (!downloadUrl) {
                console.error("❌ No se encontró una URL de descarga válida en:", data);
                return sock.sendMessage(from, { text: "La API no proporcionó un enlace de descarga válido." });
            }

            // Enviamos el archivo de audio directamente
            console.log("🚀 Enviando audio a WhatsApp...");
            await sock.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mpeg',
                fileName: `${data.title || 'music'}.mp3`,
                ptt: false // Cambia a true si quieres que se envíe como nota de voz
            }, { quoted: m });

        } catch (e) {
            console.error("--- ERROR SP DL DETALLADO ---");
            if (e.response) {
                // Error de la API (403, 404, 500)
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
            } else if (e.code === 'ECONNABORTED') {
                console.error("Error: Tiempo de espera agotado (Timeout)");
                await sock.sendMessage(from, { text: "La descarga tardó demasiado. Intenta con una canción más corta." });
                return;
            } else {
                console.error("Mensaje:", e.message);
            }
            
            await sock.sendMessage(from, { text: "El servidor de Spotify no respondió o el link es inválido." });
        }
    }
};
