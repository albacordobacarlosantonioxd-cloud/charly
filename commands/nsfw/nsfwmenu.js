export default {
    name: 'nsfwmenu',
    run: async (sock, m, from, text, quoted) => {
        const nsfwCaption = `❀ *NSFW MENU* ❀\n\n◈ \`.nsfw\`\n> _Comandos NSFW generales_\n\n*Nota: Uso responsable y exclusivo para adultos.*`;
        await sock.sendMessage(from, { text: nsfwCaption }, { quoted: m });
    }
};
