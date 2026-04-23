module.exports = {
    name: "translate",
    run: async (sock, m, from, text, quoted) => {
        const { Translate } = require('@google-cloud/translate').v2;
        const translate = new Translate();
        
        if (!text) return sock.sendMessage(from, { text: "Escribe el texto a traducir." }, { quoted: m });
        
        try {
            const [translation] = await translate.translate(text, 'es');
            await sock.sendMessage(from, { text: `🌐 *Traducción:* ${translation}` }, { quoted: m });
        } catch (e) {
            sock.sendMessage(from, { text: "❌ Error al traducir." }, { quoted: m });
        }
    }
};