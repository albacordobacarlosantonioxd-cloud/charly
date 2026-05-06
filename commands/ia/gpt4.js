import axios from "axios";

export default {
    name: "chatgpt",
    category: 'ia',
    aliases: ["gpt", "gpt4"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe una duda para ChatGPT." });

        try {
            const key = "sasuke"; 
            // Usando el endpoint de sesión para memoria por usuario
            const urlFinal = `https://api.evogb.org/ai/gpt4-session?text=${encodeURIComponent(text)}&session=${from}&key=${key}`;

            const response = await axios.get(urlFinal);
            
            // Log para debug en Railway
            console.log("--- DEBUG CHATGPT ---");
            console.log("Payload recibido:", response.data);

            const respuestaIA = response.data.result || response.data.response || response.data.data;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "La API respondió pero el mensaje vino vacío." });
            }

            await sock.sendMessage(from, { 
                text: respuestaIA.trim() 
            }, { quoted: m });

        } catch (e) {
            // Reporte de errores detallado
            console.error("--- ERROR CHATGPT DETALLADO ---");
            if (e.response) {
                // El servidor de la API respondió con error (403, 401, 500, etc)
                console.error("Status:", e.response.status);
                console.error("Data de error:", e.response.data);
            } else if (e.request) {
                // No hubo respuesta del servidor
                console.error("No se recibió respuesta del servidor de la API.");
            } else {
                console.error("Mensaje:", e.message);
            }
            
            await sock.sendMessage(from, { text: `Error: ${e.message}` });
        }
    }
};
