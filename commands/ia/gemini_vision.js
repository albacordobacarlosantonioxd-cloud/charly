const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = async (sock, m, from, text, quoted) => {
    try {
        // 1. EXTRAER LA IMAGEN
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directMsg = m.message?.imageMessage;
        const imgMessage = quotedMsg?.imageMessage || directMsg;

        if (!imgMessage) {
            return sock.sendMessage(from, { text: '❌ No veo la foto, wero. Asegúrate de responder a una imagen con el comando.' });
        }

        // 2. CONFIGURACIÓN (Tu API Key de Gemini 2.5)
        const apiKey = process.env.GEMINI_API_KEY; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        await sock.sendMessage(from, { text: '🔍 ¡Ya encontré la foto! Analizando con Gemini 2.5...' });

        // 3. DESCARGAR LA IMAGEN
        const stream = await downloadContentFromMessage(imgMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const base64Image = buffer.toString('base64');

        // 4. PREPARAR EL PROMPT
        // El comando es 'responde' o 'ayuda' que antes usaba este código
        // Como no tenemos el comando aquí, lo generalizamos
        const instrucciones = "Resuelve esta tarea o problema de la imagen paso a paso.";

        // 5. LLAMADA A TU API
        const response = await axios.post(url, {
            contents: [{
                parts: [
                    { text: instrucciones + (text ? ` Además el usuario dice: ${text}` : "") },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            const resultado = response.data.candidates[0].content.parts[0].text;
            await sock.sendMessage(from, { text: `${resultado}` }, { quoted: m });
            console.log(`[📸] Tarea resuelta con éxito.`);
        }

    } catch (e) {
        console.error("ERROR:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un fallo al procesar la imagen con la API.' });
    }
};
