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

            const response = await axios.get(urlFinal);
            
            // Log para ver qué llega exactamente de la API
            console.log("Respuesta completa de la API:", response.data);

            const respuestaIA = response.data.result || response.data.response || response.data.data;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "La API respondió pero el mensaje vino vacío." });
            }

            await sock.sendMessage(from, { 
                text: respuestaIA.trim() 
            }, { quoted: m });

        } catch (e) {
            // Log ultra detallado para Railway
            if (e.response) {
                // El servidor respondió con un código fuera del rango 2xx
                console.error("--- ERROR DE RESPUESTA ---");
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
            } else if (e.request) {
                // La petición se hizo pero no hubo respuesta
                console.error("--- ERROR DE CONEXIÓN (No hubo respuesta) ---");
            } else {
                // Algo pasó al configurar la petición
                console.error("--- ERROR GENERAL ---", e.message);
            }

            await sock.sendMessage(from, { text: `Error: ${e.message}` });
        }
    }
};
