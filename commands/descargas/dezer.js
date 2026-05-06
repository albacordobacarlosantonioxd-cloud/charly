import axios from "axios";

export default {
    name: "deezer",
    category: 'tools',
    aliases: ["play", "musica"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el nombre de la canción o el artista." });

        try {
            const key = "sasuke";

            // STEP 1: Buscar la canción en Deezer (Endpoint 1)
            console.log("--- BUSCANDO EN DEEZER ---");
            const searchRes = await axios.get(`https://api.evogb.org/search/deezer?query=${encodeURIComponent(text)}&limit=1&key=${key}`);
            
            // Tomamos el primer resultado
            const resultado = searchRes.data.result?.[0];

            if (!resultado || !resultado.link) {
                return sock.sendMessage(from, { text: "No encontré esa canción en Deezer." });
            }

            console.log(`🎵 Canción encontrada: ${resultado.title} - ${resultado.artist.name}`);

            // STEP 2: Obtener el link de descarga (Endpoint 2)
            console.log("--- OBTENIENDO ARCHIVO DE AUDIO ---");
            const dlRes = await axios.get(`https://api.evogb.org/dl/deezer?url=${encodeURIComponent(resultado.link)}&key=${key}`);
            
            const finalData = dlRes.data.result;
            const audioUrl = finalData?.url || finalData?.download;

            if (!audioUrl) {
                return sock.sendMessage(from, { text: "No se pudo generar el enlace de descarga para esta canción." });
            }

            // STEP 3: Enviar como DOCUMENTO (Para que no se pierda calidad)
            console.log("--- ENVIANDO AUDIO ---");
            await sock.sendMessage(from, {
                document: { url: audioUrl },
                fileName: `${resultado.artist.name} - ${resultado.title}.mp3`,
                mimetype: 'audio/mpeg',
                caption: `✅ *${resultado.title}*\n👤 *Artista:* ${resultado.artist.name}\n\nAquí tienes tu música lista.`
            }, { quoted: m });

        } catch (e) {
            console.error("Error en flujo Deezer:", e.message);
            await sock.sendMessage(from, { text: "Hubo un fallo con el servidor de música. Intenta de nuevo." });
        }
    }
};
