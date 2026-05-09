export default {
    name: 'menu',
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DE COMANDOS* ✨

《✧》 *INTELIGENCIA ARTIFICIAL*

◈ .chatgpt / .gpt / .gpt4
> Consulta a la última versión de ChatGPT.

◈ .claude / .clau
> IA avanzada ideal para programación y análisis.

◈ .gemini / .gemi / .google
> Habla directamente con la IA de Google Gemini.

◈ .nanobanana / .nb / .iaimg
> Generador de imágenes por IA (Uchiha Vision).

◈ .realista / .toreal
> Convierte imágenes de anime a estilo realista.

◈ .responde / .tarea / .soluciona
> Resuelve tareas enviando una foto o video.

《✧》 *MULTIMEDIA & DOWNLOAD*

◈ .video / .ytvideo
> Descarga videos de YouTube en formato MP4 (720p).

◈ .apk / .modapk / .dapk
> Busca y descarga aplicaciones para Android.

◈ .mediafire / .mf
> Descarga archivos pesados directamente de MediaFire.

◈ .facebook / .fb / .fbdl
> Descarga videos de Facebook fácilmente.

◈ .instagram / .ig / .reels
> Descarga fotos, videos y Reels de Instagram.

◈ .tiktok / .tt
> Descarga videos de TikTok sin marca de agua.

◈ .spotify / .sp / .sps
> Descarga tus canciones favoritas de Spotify.

《✧》 *BÚSQUEDA & UTILIDAD*

◈ .pinterest / .pin
> Busca y descarga un álbum de imágenes de Pinterest.

◈ .ytsearch / .yt / .youtube / .buscar
> Busca videos en YouTube y muestra los resultados.

◈ .spotifysearch / .searchsp
> Busca canciones y obtén links de Spotify.

◈ .letra / .lyrics / .l
> Busca la letra completa de cualquier canción.

《✧》 *HERRAMIENTAS*

◈ .pfp / .perfilfoto
> Obtiene la foto de perfil de un usuario en HD.

◈ .hd / .upscale
> Mejora la calidad de una imagen (x2).

◈ .sticker / .s
> Convierte imágenes o videos en stickers.

◈ .tempmail / .mail / .generarcorreo
> Crea un correo electrónico temporal al instante.

◈ .ping / .p
> Muestra la latencia y velocidad de CHARLY-BOT.

《✧》 *ADMINISTRACIÓN DE GRUPOS*

◈ .tag
> Menciona a todos los miembros del grupo.

◈ .kick / .sacar / .eliminar
> Expulsa a un usuario del grupo (Solo Admins).

◈ .promote / .demote
> Da o quita el rango de administrador.

◈ .link / .enlace / .invitacion
> Obtiene el link de invitación del grupo actual.

◈ .del / .delete
> Borra un mensaje respondido (Solo Admins).

《✧》 *CONTENIDO +18*

◈ .nsfwmenu
> Accede al menú completo de comandos restringidos.

> _Propiedad de Charly - Desarrollado para el Clan HOT ON_`;

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
