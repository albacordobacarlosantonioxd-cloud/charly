import axios from "axios";

export default {
    name: "deezer",
    category: 'tools',
    aliases: ["musica"],
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
            
            console.log("--- RESPUESTA BUSQUEDA DATA: ---", JSON.stringify(searchRes.data, null, 2));
            
            const resultado = searchRes.data.result?.[0];
            if (!resultado || !resultado.link) {
                console.log("--- AVISO: No se encontraron resultados o link de Deezer ---");
                return;
            }

            // STEP 2: Descargar
            console.log("--- DEBUG DOWNLOAD: OBTENIENDO URL FINAL ---");
            const dlUrl = `https://api.evogb.org/dl/deezer?url=${encodeURIComponent(resultado.link)}&key=${key}`;
            console.log("URL DE PETICIÓN DL:", dlUrl);

            const dlRes = await axios.get(dlUrl, { headers });
            
            console.log("--- RESPUESTA DOWNLOAD DATA: ---", JSON.stringify(dlRes.data, null, 2));
            
            const finalData = dlRes.data.result;
            const audioUrl = finalData?.url || finalData?.download;

            if (!audioUrl) {
                console.log("--- AVISO: No se obtuvo audioUrl de la respuesta final ---");
                return;
            }

            // STEP 3: Enviar
            console.log("--- DEBUG ENVIO: ENVIANDO MP3 AL USUARIO ---");
            console.log("URL FINAL DEL ARCHIVO:", audioUrl);

            await sock.sendMessage(from, {
                document: { url: audioUrl },
                fileName: `${resultado.artist.name} - ${resultado.title}.mp3`,
                mimetype: 'audio/mpeg'
            }, { quoted: m });

            console.log("--- DEBUG: PROCESO COMPLETADO EXITOSAMENTE ---");

        } catch (e) {
            console.error("--- !!! DEBUG ERROR DEEZER !!! ---");
            console.error("Mensaje de error:", e.message);
            if (e.response) {
                console.error("Status del error:", e.response.status);
                console.error("Data del error (Cuerpo):", JSON.stringify(e.response.data, null, 2));
                console.error("Headers del error:", e.response.headers);
            } else if (e.request) {
                console.error("No hubo respuesta de la API (Request enviado)");
            }
        }
    }
};
