import axios from "axios";

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
            console.log("--- DEBUG BUSQUEDA: INICIANDO ---");
            const searchRes = await axios.get(`https://api.evogb.org/search/deezer?query=${encodeURIComponent(text)}&limit=1&key=${key}`, { headers });
            
            // CAMBIO AQUÍ: La API usa .data en lugar de .result
            const resultado = searchRes.data.data?.[0]; 
            
            // CAMBIO AQUÍ: La API usa .url en lugar de .link
            if (!resultado || !resultado.url) {
                console.log("--- AVISO: No se encontró la URL en la data de búsqueda ---");
                return;
            }

            // STEP 2: Descargar
            console.log("--- DEBUG DOWNLOAD: OBTENIENDO URL FINAL ---");
            const dlUrl = `https://api.evogb.org/dl/deezer?url=${encodeURIComponent(resultado.url)}&key=${key}`;
            
            const dlRes = await axios.get(dlUrl, { headers });
            
            // Verificamos si la descarga también cambió su estructura
            const finalData = dlRes.data.data || dlRes.data.result; 
            const audioUrl = finalData?.url || finalData?.download;

            if (!audioUrl) {
                console.log("--- ERROR: No se pudo obtener el audioUrl final ---");
                console.log("Respuesta de DL recibida:", JSON.stringify(dlRes.data, null, 2));
                return;
            }

            // STEP 3: Enviar
            await sock.sendMessage(from, {
                document: { url: audioUrl },
                fileName: `${resultado.artist} - ${resultado.title}.mp3`,
                mimetype: 'audio/mpeg'
            }, { quoted: m });

            console.log("--- DEBUG: MP3 ENVIADO CON ÉXITO ---");

        } catch (e) {
            console.error("--- ERROR EN DEEZER ---");
            console.error(e.message);
        }
    }
};
