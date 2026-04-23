const axios = require('axios');
const FormData = require('form-data');

async function uploadAudio(buffer) {
    try {
        const bodyForm = new FormData();
        bodyForm.append('fileToUpload', buffer, {
            filename: `audio_${Date.now()}.mp3`,
            contentType: 'audio/mpeg'
        });
        bodyForm.append('reqtype', 'fileupload');

        const res = await axios.post('https://catbox.moe/user/api.php', bodyForm, {
            headers: {
                ...bodyForm.getHeaders()
            }
        });

        return res.data;
    } catch (err) {
        console.error('Error al subir audio a Catbox:', err);
        throw new Error('No se pudo subir el audio a internet, compa.');
    }
}

module.exports = {
    name: 'separate',
    aliases: ['vocal', 'separe'],
    run: async (sock, m, from, text, quoted) => {
        const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
        const isAudio = m.message.audioMessage || quoted?.audioMessage;

        if (!isAudio) return sock.sendMessage(from, { text: '❌ Responde a un audio o nota de voz, pariente.' }, { quoted: m });

        try {
            await sock.sendMessage(from, { 
                text: `❀ *PROCESANDO AUDIO* ❀\n\n> ☁️ Separando voz y pista... Espera un momento.` 
            }, { quoted: m });

            const messageToDownload = quoted?.audioMessage || m.message.audioMessage;
            const stream = await downloadContentFromMessage(messageToDownload, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            const audioUrl = await uploadAudio(buffer); 

            const response = await axios.get(`https://api.stellarwa.xyz/tools/vocalremover?url=${encodeURIComponent(audioUrl)}&key=api-qG4nw`);
            const json = response.data;

            if (json.status && json.vocal) {
                await sock.sendMessage(from, { 
                    audio: { url: json.vocal }, 
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: m });

                await sock.sendMessage(from, { 
                    audio: { url: json.instrumental }, 
                    mimetype: 'audio/mpeg', 
                    ptt: false 
                });

                await sock.sendMessage(from, { 
                    text: `❀ *¡LISTO!* ❀\n\n> 🎙️ El primero es la *VOZ*.\n> 🎹 El segundo es la *PISTA*.\n\n_By Charly-Bot_` 
                });

            } else {
                sock.sendMessage(from, { text: "❌ La API falló. Intenta con un audio más corto." });
            }

        } catch (e) {
            console.error("Error:", e);
            sock.sendMessage(from, { text: "❌ Hubo un error en el proceso." });
        }
    }
};
