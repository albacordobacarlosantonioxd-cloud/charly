import evogb from "../../lib/apiClient.js";

export default {
    name: "apk",
    category: 'ia',
    aliases: ["dapk", "mod"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el nombre de la APK que buscas." });

        try {
            const key = "sasuke";

            // STEP 1: Buscar la APK (Endpoint 1)
            console.log("--- BUSCANDO APK ---");
            const searchRes = await evogb.get(`https://api.evogb.org/search/apk?query=${encodeURIComponent(text)}&key=${key}`);
            
            // Accedemos al primer resultado de la lista
            const resultado = searchRes.data.result?.[0];

            if (!resultado || !resultado.url) {
                return sock.sendMessage(from, { text: "No encontré resultados para esa APK." });
            }

            console.log(`🔗 APK Encontrada: ${resultado.name} | URL: ${resultado.url}`);

            // STEP 2: Obtener el link de descarga directo (Endpoint 2)
            console.log("--- OBTENIENDO LINK DE DESCARGA ---");
            const dlRes = await evogb.get(`https://api.evogb.org/dl/apk?url=${encodeURIComponent(resultado.url)}&key=${key}`);
            
            const finalData = dlRes.data.result;
            const linkDirecto = finalData?.url || finalData?.download;

            if (!linkDirecto) {
                return sock.sendMessage(from, { text: "No se pudo generar el enlace de descarga directa." });
            }

            // STEP 3: Enviar como DOCUMENTO
            console.log("--- ENVIANDO ARCHIVO ---");
            await sock.sendMessage(from, {
                document: { url: linkDirecto },
                fileName: `${resultado.name}.apk`,
                mimetype: 'application/vnd.android.package-archive',
                caption: `✅ *${resultado.name}*\n\nAquí tienes tu archivo listo para instalar.`
            }, { quoted: m });

        } catch (e) {
            console.error("Error en el flujo APK:", e.message);
            await sock.sendMessage(from, { text: "El servidor de la API no respondió correctamente. Intenta más tarde." });
        }
    }
};
