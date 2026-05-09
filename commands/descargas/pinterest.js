import axios from "axios";

export default {
    name: "pinterest",
    category: 'search',
    aliases: ["pin"],
    run: async (sock, m, from, text) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";

        if (!text) {
            return sock.sendMessage(from, { 
                text: `*¡Hola!* ¿Qué imágenes buscas?\n\n*Ejemplo:* .pinterest Yamaha MT-09 modificada` 
            }, { quoted: m });
        }

        // Reacción de búsqueda
        await sock.sendMessage(from, { react: { text: "🔍", key: m.key } });

        try {
            const apiUrl = `https://api.delirius.store/search/pinterest?text=${encodeURIComponent(text)}`;
            const { data } = await axios.get(apiUrl);

            if (!data.status || !data.results || data.results.length === 0) {
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                return sock.sendMessage(from, { text: "No se encontraron imágenes para tu búsqueda." }, { quoted: m });
            }

            // Limitamos a 6 resultados para no saturar el chat
            const limitedResults = data.results.slice(0, 6);
            
            const albumCaption = `*〔 PINTEREST ALBUM 〕*\n\n*Búsqueda:* ${text}\n\n⚡ *${dev}*\n📡 *${chn}*`;

            // Enviamos las imágenes una por una con un pequeño delay para simular el álbum
            for (let i = 0; i < limitedResults.length; i++) {
                await sock.sendMessage(from, { 
                    image: { url: limitedResults[i] }, 
                    caption: i === 0 ? albumCaption : '' // Solo la primera imagen lleva el texto largo
                }, { quoted: m });
                
                // Pequeña pausa de 500ms para evitar spam filter de WhatsApp
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

        } catch (error) {
            console.error("Error en Pinterest Search:", error);
            await sock.sendMessage(from, { react: { text: "⚠️", key: m.key } });
            sock.sendMessage(from, { text: "Ocurrió un error al procesar la búsqueda en CHARLY-BOT." }, { quoted: m });
        }
    }
};
