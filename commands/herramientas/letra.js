module.exports = {
    name: 'letra',
    alias: ['lyrics'],
    run: async (sock, m, from, text, quoted) => {
        if (!text) return await sock.sendMessage(from, { text: 'Por favor, ingresa el nombre de la canción' }, { quoted: m });
        
        // Aquí iría la lógica para buscar la letra
        await sock.sendMessage(from, { text: `Buscando letra para: ${text}` }, { quoted: m });
    }
};
