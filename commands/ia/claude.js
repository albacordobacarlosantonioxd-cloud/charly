import axios from "axios";

export default {
    name: "claude",
    category: 'ia',
    aliases: ["clau"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe una duda para Claude." });

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/ai/claude?text=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'es-MX,es;q=0.9',
                    'Referer': 'https://api.evogb.org/',
                    'Connection': 'keep-alive'
                },
                timeout: 15000 // 15 segundos de espera
            });
            
            console.log("Respuesta completa de la API:", response.data);

            const respuestaIA = response.data.result || response.data.response || response.data.data;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "La API respondió pero el mensaje vino vacío." });
            }

            await sock.sendMessage(from, { 
                text: respuestaIA.trim() 
            }, { quoted: m });

        } catch (e) {
            if (e.response) {
                console.error("--- ERROR DE RESPUESTA ---");
                console.error("Status:", e.response.status);
                
                // Si es un 403, es probable que Cloudflare nos haya detectado
                if (e.response.status === 403) {
                    return sock.sendMessage(from, { text: "Error 403: Cloudflare bloqueó la petición desde el servidor. Intenta de nuevo en unos minutos." });
                }
            } else if (e.request) {
                console.error("--- ERROR DE CONEXIÓN (No hubo respuesta) ---");
            } else {
                console.error("--- ERROR GENERAL ---", e.message);
            }

            await sock.sendMessage(from, { text: `Error: ${e.message}` });
        }
    }
};
