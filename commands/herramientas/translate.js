import gtts from 'google-tts-api';
import axios from 'axios';

export default {
    name: "tts",
    aliases: ["audiotexto", "decir"],
    category: "utilidad",
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: "❌ Escribe el texto que quieres convertir a audio." }, { quoted: m });

        try {
            console.log(`[DEBUG] Generando audio (Voz MX) para: ${text.substring(0, 30)}...`);

            // Generar URL con acento Mexicano
            const url = gtts.getAudioUrl(text, {
                lang: 'es-MX', // <--- Aquí es donde sucede la magia mexicana
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
            console.log(`[DEBUG] Buffer de audio creado. Tamaño: ${audioBuffer.length} bytes`);

            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mp4', 
                ptt: false // Se queda en false para que no falle en el cel
            }, { quoted: m });

            console.log(`[DEBUG] Audio enviado correctamente al grupo/chat.`);

        } catch (e) {
            console.error("======== [ ERROR EN TTS ] ========");
            console.error(e);
            console.error("==================================");
            sock.sendMessage(from, { text: "❌ Error al generar el audio. Intenta con un texto más corto." }, { quoted: m });
        }
    }
};
