import axios from "axios";

export default {
    name: "spotifysearch",
    category: 'busqueda',
    aliases: ["searchsp", "buscarsong"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el nombre de la canción para buscar en Spotify." });

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/search/spotify?query=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal);
            
            // Accedemos directamente a response.data.result basado en tu JSON
            const results = response.data.result;

            if (!results || results.length === 0) {
                return sock.sendMessage(from, { text: "No encontré resultados, pariente." });
            }

            // Construimos la lista de resultados
            let txt = `🎵 *Resultados para:* _${text}_\n\n`;
            
            results.slice(0, 5).forEach((track, i) => {
                txt += `*${i + 1}.* ${track.title}\n`;
                txt += `👤 *Artista:* ${track.artist}\n`;
                txt += `🔗 *Link:* ${track.link}\n\n`;
            });

            txt += `_Copia el link y usa el comando .spotify para descargarla._`;

            // Enviamos la imagen del primer resultado con la lista
            await sock.sendMessage(from, { 
                image: { url: results[0].image }, 
                caption: txt 
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR SP SEARCH:", e.message);
            await sock.sendMessage(from, { text: "El servidor de búsqueda está saturado. Intenta de nuevo." });
        }
    }
};
