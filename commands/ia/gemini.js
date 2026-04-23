const axios = require('axios');

module.exports = async (sock, m, from, text, quoted) => {
    if (!text) return sock.sendMessage(from, { text: '¿Qué onda wero? Pregúntame algo con el poder de Gemini 2.5.' });

    const apiKey = process.env.GEMINI_API_KEY; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        console.log(`\n[♊] LLAMANDO AL PODEROSO GEMINI 2.5 FLASH: ${text}`);

        const response = await axios.post(url, {
            contents: [{
                role: "user",
                parts: [{ text: text }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            const respuestaIA = response.data.candidates[0].content.parts[0].text;
            await sock.sendMessage(from, { text: respuestaIA }, { quoted: m });
            console.log(`[✨] ¡CORONAMOS CON 2.5 FLASH!`);
        } else {
            await sock.sendMessage(from, { text: '⚠️ El modelo 2.5 recibió la orden pero no generó texto (posible filtro).', quoted: m });
        }

    } catch (e) {
        if (e.response) {
            console.error("DETALLE TÉCNICO 2.5:", JSON.stringify(e.response.data));
            const msg = e.response.data.error.message;
            await sock.sendMessage(from, { text: `❌ Error en Gemini 2.5: ${msg}` }, { quoted: m });
        } else {
            console.error("ERROR:", e.message);
            await sock.sendMessage(from, { text: '❌ Error de conexión con Google Cloud.', quoted: m });
        }
    }
};
