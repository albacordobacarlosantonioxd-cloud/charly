module.exports = {
    name: 'playlist',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return await sock.sendMessage(from, { text: 'Por favor, ingresa el enlace de la playlist' }, { quoted: m });
        
        // Aquí iría la lógica para descargar la playlist
        await sock.sendMessage(from, { text: `Descargando playlist: ${text}` }, { quoted: m });
    }
};
