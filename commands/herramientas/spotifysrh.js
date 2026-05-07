import axios from "axios";

export default {
    name: "spotifysearch",
    category: 'busqueda',
    aliases: ["searchsp", "buscarsong"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el nombre de la canción para buscar en Spotify." });

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.axios.org/search/spotify?query=${encodeURIComponent(text)}&key=${key}`;

            console.log("--- DEBUG SP SEARCH ---");
            console.log("Buscando:", text);

            const response = await axios.get(urlFinal);
            const res = response.data;

            if (res.status && res.result && res.result.length > 0) {
                const results = res.result;

                // Construimos la lista de resultados en texto plano
                let txt = `🎵 *Resultados para:* _${text}_\n\n`;
                
                results.slice(0, 5).forEach((track, i) => {
                    txt += `*${i + 1}.* ${track.title}\n`;
                    txt += `👤 *Artista:* ${track.artist}\n`;
                    txt += `🔗 *Link:* ${track.link}\n\n`;
                });

                txt += `_Copia el link y usa el comando .spotify para descargarla._`;

                // Enviamos SOLO el texto para evitar el crash de GLib/Segfault
                await sock.sendMessage(from, { text: txt }, { quoted: m });

            } else {
                await sock.sendMessage(from, { text: "No encontré resultados, pariente." });
            }

        } catch (e) {
            console.error("--- ERROR SPOTIFY SEARCH ---");
            console.error("Mensaje:", e.message);
            await sock.sendMessage(from, { text: `Error en la búsqueda: ${e.message}` });
        }
    }
};
