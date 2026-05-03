import gtts from 'google-tts-api';
import axios from 'axios';

export default {
    name: "tts",
    aliases: ["audiotexto", "decir"],
    category: "utilidad",
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: "❌ Escribe el texto que quieres convertir a audio." }, { quoted: m });

        try {
            // Generar URL
            const url = gtts.getAudioUrl(text, {
                lang: 'es',
                slow: false,
                host: 'https://translate.google.com',
            });

            // Descargar el audio
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'arraybuffer'
            });

            const audioBuffer = Buffer.from(response.data);

            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mp4', // Cambiado a mp4 para mejor compatibilidad en WP
                ptt: true
            }, { quoted: m });

        } catch (e) {
            console.error("Error en TTS:", e);
            sock.sendMessage(from, { text: "❌ Error al generar el audio. Intenta con un texto más corto." }, { quoted: m });
        }
    }
};