import axios from "axios";

export default {
    name: "flux",
    run: async (sock, m, from, text, quoted, args) => {
        if (!text) return sock.sendMessage(from, { text: '¿Qué quieres que cree la IA? Ejemplo: .ia un astronauta en Marte' });

        try {
            const options = {
                method: 'POST',
                url: 'https://ai-text-to-image-generator-flux-free-api.p.rapidapi.com/aaaaaaaaaaaaaaaaaiimagegenerator/quick.php',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-host': process.env.FLUX_RAPIDAPI_HOST,
                    'x-rapidapi-key': process.env.FLUX_RAPIDAPI_KEY 
                },
                data: {
                    prompt: text,
                    style_id: 4,
                    size: '1-1'
                }
            };

            await sock.sendMessage(from, { text: `⏳ Generando 2 imágenes de "${text}" con FLUX...` });

            const response = await axios.request(options);
            const results = response.data.final_result;

            if (!results || results.length === 0) {
                return sock.sendMessage(from, { text: '❌ La IA no pudo generar las imágenes en este momento.' });
            }

            for (const item of results) {
                await sock.sendMessage(from, { 
                    image: { url: item.origin }, 
                    caption: `✨ *IA FLUX:* ${text}\n🔞 *NSFW:* ${item.nsfw ? 'Sí' : 'No'}`
                }, { quoted: m });
            }

        } catch (error) {
            console.error("ERROR EN FLUX API:", error);
            sock.sendMessage(from, { text: '❌ Hubo un error al conectar con el servidor de IA.' });
        }
    }
};