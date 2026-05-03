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
            // Endpoint basado en tu imagen: /dl/spotify
            const urlFinal = `https://api.evogb.org/dl/spotify?url=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal);
            const data = response.data.result || response.data.data;

            if (!data) return sock.sendMessage(from, { text: "No pude obtener el archivo de Spotify, checa el link." });

/*
            // Enviamos un mensaje de espera con la portada si viene en la respuesta
            await sock.sendMessage(from, { 
                image: { url: data.thumbnail || data.image || data.cover }, 
                caption: `🎧 *Descargando:* ${data.title || 'Música de Spotify'}\n\n_Aguanta un momento en lo que se envía el audio..._` 
            }, { quoted: m });
*/
            // Enviamos el archivo de audio directamente
            await sock.sendMessage(from, { 
                audio: { url: data.url || data.dl_url || data.download }, 
                mimetype: 'audio/mpeg',
                fileName: `${data.title || 'music'}.mp3`
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR SP DL:", e.message);
            await sock.sendMessage(from, { text: "El servidor de Spotify no respondió. Intenta más tarde." });
        }
    }
};
