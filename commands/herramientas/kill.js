module.exports = {
    name: 'kill',
    run: async (sock, m, from, text, quoted) => {
        // Comando para cerrar/reiniciar bot o kickear?
        await sock.sendMessage(from, { text: 'Comando kill ejecutado' }, { quoted: m });
    }
};
