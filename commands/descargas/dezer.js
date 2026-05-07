import evogb from "../../lib/apiClient.js";

export default {
    name: "deezer",
    category: 'tools',
    aliases: ["play", "musica"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return;

        try {
            const key = "sasuke";
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://api.evogb.org/',
                'Origin': 'https://api.evogb.org'
            };

            // STEP 1: Buscar
            console.log("--- BUSCANDO EN DEEZER ---");
            const searchRes = await evogb.get(`https://api.evogb.org/search/deezer?query=${encodeURIComponent(text)}&limit=1&key=${key}`, { headers });
            
            const resultado = searchRes.data.result?.[0];
            if (!resultado || !resultado.link) return;

            // STEP 2: Descargar (Aquí es donde suele dar el 403)
            console.log("--- OBTENIENDO AUDIO ---");
            const dlUrl = `https://api.evogb.org/dl/deezer?url=${encodeURIComponent(resultado.link)}&key=${key}`;
            const dlRes = await evogb.get(dlUrl, { headers });
            
            const finalData = dlRes.data.result;
            const audioUrl = finalData?.url || finalData?.download;

            if (!audioUrl) return;

            // STEP 3: Enviar
            console.log("--- ENVIANDO MP3 ---");
            await sock.sendMessage(from, {
                document: { url: audioUrl },
                fileName: `${resultado.artist.name} - ${resultado.title}.mp3`,
                mimetype: 'audio/mpeg'
            }, { quoted: m });

        } catch (e) {
            console.error("--- DEBUG DEEZER 403 ---");
            console.error("Mensaje:", e.message);
            if (e.response) {
                console.error("Data del error:", e.response.data);
            }
        }
    }
};
