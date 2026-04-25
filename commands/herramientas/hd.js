import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

async function uploadToCatbox(buffer) {
    const bodyForm = new FormData();
    bodyForm.append('fileToUpload', buffer, 'image.png');
    bodyForm.append('reqtype', 'fileupload');
    const res = await axios.post('https://catbox.moe/user/api.php', bodyForm, {
        headers: bodyForm.getHeaders(),
        timeout: 30000
    });
    if (typeof res.data === 'string' && res.data.startsWith('http')) {
        return res.data;
    }
    throw new Error('Catbox no devolvió una URL válida');
}

async function uploadTo0x0(buffer) {
    const bodyForm = new FormData();
    bodyForm.append('file', buffer, 'image.png');
    const res = await axios.post('https://0x0.st', bodyForm, {
        headers: bodyForm.getHeaders(),
        timeout: 30000
    });
    if (typeof res.data === 'string' && res.data.startsWith('http')) {
        return res.data.trim();
    }
    throw new Error('0x0.st no devolvió una URL válida');
}

async function uploadImage(buffer) {
    let lastErr;
    // Intentar catbox primero
    try {
        return await uploadToCatbox(buffer);
    } catch (err) {
        lastErr = err;
        console.warn('[HD] Catbox falló:', err.message);
    }
    // Fallback a 0x0.st
    try {
        return await uploadTo0x0(buffer);
    } catch (err) {
        lastErr = err;
        console.warn('[HD] 0x0.st falló:', err.message);
    }
    throw new Error(`No se pudo subir la imagen: ${lastErr?.message || 'Error desconocido'}`);
}

export default {
    name: "hd",
    run: async (sock, m, from, text, quoted) => {
        try {
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message?.imageMessage;

            if (!isImage && !isQuotedImage) {
                return sock.sendMessage(from, { text: '❌ Responde a una imagen para mejorarla.' }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Mejorando calidad... esto puede tardar un poco pariente.*' }, { quoted: m });

            const messageToDownload = isQuotedImage ? quoted.imageMessage : m.message.imageMessage;
            const stream = await downloadContentFromMessage(messageToDownload, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const imageUrl = await uploadImage(buffer); 
            if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
                throw new Error('El servicio de subida no devolvió una URL válida.');
            }

            const apiKey = "sylphy-ty5xtWm";
            const apiUrl = `https://sylphyy.xyz/tools/upscale?url=${encodeURIComponent(imageUrl)}&scale=2&api_key=${apiKey}`;

            const response = await axios.get(apiUrl, { timeout: 150000 });
            console.log("[HD] Respuesta API:", JSON.stringify(response.data, null, 2));
            
            const finalImageUrl = response.data.result?.dl_url || response.data.data?.url || response.data.url || response.data.result?.url || response.data;

            if (finalImageUrl && typeof finalImageUrl === 'string' && finalImageUrl.startsWith('http')) {
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
