export default {
    name: 'menu',
    category: 'herramientas',
    run: async (sock, m, from, text, { usedPrefix }) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DINÁMICO* ✨
> *Prefijo:* [ ${usedPrefix} ]

《✧》 *INTELIGENCIA ARTIFICIAL*
◈ ${usedPrefix}gpt4 / ${usedPrefix}claude
◈ ${usedPrefix}gemini / ${usedPrefix}copilot
◈ ${usedPrefix}flux / ${usedPrefix}nanobanana
◈ ${usedPrefix}iarealistic / ${usedPrefix}ia
◈ ${usedPrefix}vozmujer (🇲🇽 Nuevo)

《✧》 *MULTIMEDIA & DOWNLOAD*
◈ ${usedPrefix}video / ${usedPrefix}audio
◈ ${usedPrefix}tiktok / ${usedPrefix}spotify
◈ ${usedPrefix}mediafire / ${usedPrefix}pinterest
◈ ${usedPrefix}dezer / ${usedPrefix}socialdl
◈ ${usedPrefix}apksrh

《✧》 *HERRAMIENTAS & UTILIDAD*
◈ ${usedPrefix}sticker / ${usedPrefix}hd
◈ ${usedPrefix}bratt / ${usedPrefix}brattv
◈ ${usedPrefix}comprimir / ${usedPrefix}pdf
◈ ${usedPrefix}googleimg / ${usedPrefix}ytsearch
◈ ${usedPrefix}spotifysearch / ${usedPrefix}letra
◈ ${usedPrefix}translate / ${usedPrefix}tempmail
◈ ${usedPrefix}rbg / ${usedPrefix}separate
◈ ${usedPrefix}pfp / ${usedPrefix}ping

《✧》 *ADMINISTRACIÓN (GRUPOS)*
◈ ${usedPrefix}tag (Mencionar todos)
◈ ${usedPrefix}kick / ${usedPrefix}promote
◈ ${usedPrefix}demote / ${usedPrefix}link
◈ ${usedPrefix}open / ${usedPrefix}close
◈ ${usedPrefix}del / ${usedPrefix}setgpdesc

《✧》 *SISTEMA DE PERFIL*
◈ ${usedPrefix}profile / ${usedPrefix}setbirth
◈ ${usedPrefix}setdesc / ${usedPrefix}sethobby
◈ ${usedPrefix}marry / ${usedPrefix}divorciarse

> _Propiedad de Charly_`;

        try {
            await sock.sendMessage(from, { 
                image: { url: imagenMenu }, 
                caption: menuCaption 
            }, { quoted: m });
        } catch (e) {
            console.error("Error en el menú:", e);
            await sock.sendMessage(from, { text: menuCaption }, { quoted: m });
        }
    }
};
