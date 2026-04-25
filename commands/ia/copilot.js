import axios from "axios";

export default {
    name: "copilot",
    category: 'ia',
    aliases: ["cop"],
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: "¿Qué onda, pariente? Suéltame tu duda para el Copilot." });

        try {
            const key = process.env.MISTRAL_API_KEY; 
            const urlFinal = `https://api.evogb.org/ai/copilot?text=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal);
            const respuestaIA = response.data.result || response.data.response || response.data.data;

            if (!respuestaIA) {
                return sock.sendMessage(from, { text: "⚠️ La API respondió pero el mensaje vino vacío, compa." });
            }

            await sock.sendMessage(from, { 
                text: `✨ *Copilot AI* \n\n${respuestaIA.trim()}` 
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR COPILOT:", e.message);
            await sock.sendMessage(from, { text: "❌ No pude conectar con el Copilot, anda de flojo el servidor." });
        }
    }
};