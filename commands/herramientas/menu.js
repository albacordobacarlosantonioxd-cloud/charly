module.exports = {
    name: 'menu',
    run: async (sock, m, from, text, quoted) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DE COMANDOS* ✨

《✧》 *INTELIGENCIA ARTIFICIAL*

◈ .copilot
> Consulta a la IA de Microsoft para código y tareas.

◈ .ia
> Chat general con la inteligencia principal del bot.

◈ .gemini
> Habla directamente con la IA de Google.

◈ .flux
> Generador avanzado de imágenes realistas.

◈ .letra / .lyrics
> Busca la letra completa de cualquier canción.

《✧》 *ASISTENCIA & TAREAS*

◈ .responde
> Resuelve tareas o trabajos enviando una foto.

◈ .ayuda
> Pide asistencia con problemas específicos.

《✧》 *MULTIMEDIA & DOWNLOAD*

◈ .audio
> Descarga música en formato MP3.

◈ .video
> Descarga videos en formato MP4.

◈ .playlist
> Descarga listas de reproducción de Spotify.

◈ .tt
> Descarga videos de TikTok sin marca de agua.

《✧》 *ADMINISTRACIÓN*

◈ .kill
> Reinicia o detiene los procesos del bot.

◈ .nsfwmenu
> Accede al menú de contenido restringido (+18).

◈ .antilink
> Activa o desactiva la protección de enlaces en grupos.

《✧》 *STICKERS & PACKS*

◈ .s / .sticker
> Crea stickers al instante.

◈ .brat
> Genera stickers con el diseño estilo \"Brat\".`;

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