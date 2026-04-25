import gtts from 'google-tts-api';
import axios from 'axios';

export default {
    name: "tts",
    aliases: ["audiotexto", "decir"],
    category: "utilidad",
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el texto que quieres convertir a audio." }, { quoted: m });

        try {
            const url = gtts.getAudioUrl(text, {
                lang: 'es',
                slow: false,
                host: 'https://translate.google.com',
            });

            const { data: audioBuffer } = await axios.get(url, { responseType: 'arraybuffer' });

            await sock.sendMessage(from, {
                audio: Buffer.from(audioBuffer),
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: m });

        } catch (e) {
            console.error("Error en TTS:", e);
            sock.sendMessage(from, { text: "❌ Error al generar el audio." }, { quoted: m });
        }
    }
};