import axios from "axios";

export default {
    name: "chatgpt",
    category: 'ia',
    aliases: ["gpt", "gpt4"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe una duda para ChatGPT." });

        try {
            const key = "sasuke"; 
            // Endpoint de la captura con sesión para memoria por usuario
            const urlFinal = `https://api.axios.org/ai/gpt4-session?text=${encodeURIComponent(text)}&session=${from}&key=${key}`;

            const response = await axios.get(urlFinal);
            const respuestaIA = response.data.result || response.data.response || response.data.data;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "La API respondió pero el mensaje vino vacío." });
            }

            await sock.sendMessage(from, { 
                text: respuestaIA.trim() 
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR CHATGPT:", e.message);
            await sock.sendMessage(from, { text: "No pude conectar con ChatGPT." });
        }
    }
};
