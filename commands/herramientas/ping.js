export default {
    name: 'ping',
    aliases: ['p'],
    run: async (sock, m, from, text, quoted) => {
        const start = Date.now();
        const { key } = await sock.sendMessage(from, { text: '🚀 *Calculando...*' }, { quoted: m });
        const latency = Date.now() - start;
        await sock.sendMessage(from, { 
            text: `✿ *Pong!*\n> Latencia: *${latency}ms`, 
            edit: key 
        }, { quoted: m });
    }
};