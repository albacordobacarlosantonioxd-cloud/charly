const axios = require("axios");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const FormData = require("form-data");

async function uploadImage(buffer) {
    try {
        const bodyForm = new FormData();
        bodyForm.append('fileToUpload', buffer, 'image.png');
        bodyForm.append('reqtype', 'fileupload');
        const res = await axios.post('https://catbox.moe/user/api.php', bodyForm, {
            headers: bodyForm.getHeaders()
        });
        return res.data;
    } catch (err) {
        throw new Error('No se pudo subir la imagen a internet');
    }
}

module.exports = {
    name: "hd",
    run: async (sock, m, from, text, quoted) => {
        try {
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message.imageMessage;

            if (!isImage && !isQuotedImage) {
                return sock.sendMessage(from, { text: '❌ Responde a una imagen para mejorarla.' }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Mejorando calidad... procesando en los servidores.*' }, { quoted: m });

            const messageToDownload = isQuotedImage ? quoted.imageMessage : m.message.imageMessage;
            const stream = await downloadContentFromMessage(messageToDownload, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const imageUrl = await uploadImage(buffer); 
            const apiKey = "sylphy-ty5xtWm";
            const apiUrl = `https://sylphyy.xyz/tools/upscale?url=${encodeURIComponent(imageUrl)}&scale=2&api_key=${apiKey}`;

            const response = await axios.get(apiUrl, { timeout: 150000 });
            const finalImageUrl = response.data.result?.dl_url;

            if (finalImageUrl) {
                await sock.sendMessage(from, { 
                    image: { url: finalImageUrl }, 
                    caption: '✅ *Calidad mejorada exitosamente.*',
                    mimetype: 'image/jpeg' 
                }, { quoted: m });
            } else {
                throw new Error('No se pudo obtener el enlace de descarga directo.');
            }
        } catch (err) {
            console.error("ERROR EN HD:", err);
            sock.sendMessage(from, { text: `❌ Fallo: ${err.message}` }, { quoted: m });
        }
    }
};