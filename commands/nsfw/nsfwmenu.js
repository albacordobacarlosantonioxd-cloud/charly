export default {
    name: 'nsfwmenu',
    category: 'nsfw',
    run: async (sock, m, from, text, quoted) => {
        const nsfwCaption = `❀ *NSFW MENU — CHARLY BOT* ❀

◈ *.anal / .violar*
◈ *.cum*
◈ *.undress / .encuerar*
◈ *.fuck / .coger*
◈ *.spank / .nalgada*
◈ *.lickpussy*
◈ *.fap / .paja*
◈ *.grope*
◈ *.sixnine / .69*
◈ *.suckboobs / .grabboobs*
◈ *.blowjob / .mamada / .bj*
◈ *.boobjob / .footjob*
◈ *.yuri / .tijeras*
◈ *.cummouth / .cumshot*
◈ *.handjob / .lickass / .lickdick*
◈ *.fingering / .creampie*
◈ *.facesitting / .deepthroat*
◈ *.thighjob / .bondage / .pegging*
◈ *.futanari / .futa / .yaoi*
◈ *.bukkake / .orgy / .orgia*
◈ *.squirt / .squirting*

> _Los videos se cargan desde el SSD local para mayor velocidad._
*Nota: Uso responsable y exclusivo para mayores de 18 años.*`;

        await sock.sendMessage(from, { 
            text: nsfwCaption,
            mentions: [m.sender] 
        }, { quoted: m });
    }
};
