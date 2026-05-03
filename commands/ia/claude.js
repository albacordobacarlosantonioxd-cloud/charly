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
            const respuestaIA = response.data.result || response.data.response || response.data.data;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "La API respondió pero el mensaje vino vacío." });
            }

            await sock.sendMessage(from, { 
                text: respuestaIA.trim() 
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR CLAUDE:", e.message);
            await sock.sendMessage(from, { text: "No pude conectar con Claude." });
        }
    }
};
