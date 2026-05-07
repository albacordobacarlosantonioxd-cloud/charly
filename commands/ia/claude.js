import axios from "axios";

export default {
    name: "claude",
    category: 'ia',
    aliases: ["clau"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe una duda para Claude." });

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.axios.org/ai/claude?text=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'es-MX,es;q=0.9',
                    'Referer': 'https://api.axios.org/',
                    'Connection': 'keep-alive'
                },
                timeout: 20000 // Aumentado a 20s por estabilidad
            });
            
            console.log("Respuesta completa de la API:", response.data);

            // Ajustado para extraer específicamente el 'result' que vimos en tu log
            const respuestaIA = response.data.result;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "La API respondió pero no se encontró el resultado." });
            }

            // Enviamos el mensaje asegurándonos de que sea un String
            await sock.sendMessage(from, { 
                text: String(respuestaIA).trim() 
            }, { quoted: m });

            console.log("✅ Mensaje enviado con éxito.");

        } catch (e) {
            console.error("--- DETALLE DEL ERROR ---");
            if (e.response) {
                console.error("Status:", e.response.status);
                if (e.response.status === 403) {
                    return sock.sendMessage(from, { text: "Error 403: Bloqueo de Cloudflare. Intenta de nuevo más tarde." });
                }
            } else {
                console.error("Mensaje:", e.message);
            }
            await sock.sendMessage(from, { text: `Error: ${e.message}` });
        }
    }
};
