export default {
    name: 'menu',
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DE COMANDOS* ✨

《✧》 *INTELIGENCIA ARTIFICIAL*

◈ .chatgpt / .gpt / .gpt4
> Consulta a la última versión de ChatGPT para respuestas rápidas.

◈ .claude / .clau
> IA avanzada ideal para programación y análisis de texto extenso.[cite: 1]

◈ .gemini / .gemi / .google
> Habla directamente con la IA de Google Gemini.[cite: 1]

◈ .copilot / .cop
> Consulta a la IA de Microsoft para código y tareas técnicas.[cite: 1]

◈ .ia / .bot / .groq / .pregunta
> Chat general con la inteligencia principal del bot.[cite: 1]

◈ .nanobanana / .nb
> Generador de imágenes por IA (Nano Banana 2).[cite: 1]

◈ .flux
> Generador avanzado de imágenes con realismo premium.[cite: 1]

◈ .responde / .tarea / .soluciona
> Resuelve tareas o dudas enviando una foto o video.[cite: 1]

《✧》 *MULTIMEDIA & DOWNLOAD*

◈ .audio / .ytaudio
> Descarga música de YouTube en formato MP3.[cite: 1]

◈ .video / .ytvideo
> Descarga videos de YouTube en formato MP4.[cite: 1]

◈ .facebook / .fb / .fbdl
> Descarga videos de Facebook fácilmente.[cite: 1]

◈ .instagram / .ig / .reels
> Descarga fotos, videos y Reels de Instagram.[cite: 1]

◈ .spotify / .sp / .sps
> Descarga tus canciones favoritas de Spotify.[cite: 1]

◈ .tiktok / .tt
> Descarga videos de TikTok sin marca de agua.[cite: 1]

◈ .letra / .lyrics / .l
> Busca la letra completa de cualquier canción.[cite: 1]

《✧》 *BÚSQUEDA & UTILIDAD*

◈ .spotifysearch / .searchsp
> Busca canciones y obtén links directos de Spotify.[cite: 1]

◈ .ytsearch / .yt / .youtube / .buscar
> Busca videos en YouTube y muestra los mejores resultados.[cite: 1]

◈ .tts / .audiotexto / .decir
> Convierte texto a audio o nota de voz.[cite: 1]

《✧》 *HERRAMIENTAS*

◈ .tempmail / .mail / .generarcorreo
> Crea un correo electrónico temporal al instante.[cite: 1]

◈ .readmail / .leercorreo / .tempread
> Lee la bandeja de entrada del correo temporal generado.[cite: 1]

◈ .hd
> Mejora la calidad de una imagen (Upscale x2).[cite: 1]

◈ .sticker / .s
> Convierte imágenes o videos en stickers.[cite: 1]

◈ .brat / .bratv
> Genera stickers con el diseño estilo "Brat".[cite: 1]

◈ .separate / .vocal / .separe
> Separa la voz de la pista instrumental de un audio.[cite: 1]

◈ .ping / .p
> Muestra la latencia y velocidad del bot.[cite: 1]

◈ .kiss / .hug / .slap
> Interacciones con GIFs (Besar, abrazar o dar una nalgada).[cite: 1]

《✧》 *PERFIL & RPG*

◈ .profile / .perfil
> Muestra tu perfil con estadísticas, nivel y dinero.[cite: 1]

◈ .work / .w / .chamba / .chambear
> Trabaja para ganar dinero (cooldown de 3 minutos).[cite: 1]

◈ .setdesc / .setdescription / .deldesc
> Gestiona tu descripción personalizada de perfil.[cite: 1]

◈ .setbirth / .setcumple
> Establece tu fecha de nacimiento en el perfil.[cite: 1]

◈ .setgenre / .setgenero / .delgenre
> Gestiona tu género en las estadísticas.[cite: 1]

◈ .sethobby / .setpasatiempo / .delhobby
> Establece o elimina tu pasatiempo favorito.[cite: 1]

◈ .marry / .casarse / .proponer
> Propón matrimonio a otro usuario del grupo.[cite: 1]

《✧》 *ADMINISTRACIÓN DE GRUPOS*

◈ .tag
> Menciona a todos los miembros del grupo (Hidetag).[cite: 1]

◈ .kick / .sacar / .eliminar
> Expulsa a un usuario del grupo (Solo Admins).[cite: 1]

◈ .promote / .demote
> Da o quita el rango de administrador a un usuario.[cite: 1]

◈ .open / .close
> Abre o cierra el grupo para que todos o solo admins hablen.[cite: 1]

◈ .link / .enlace / .invitacion
> Obtiene el link de invitación del grupo actual.[cite: 1]

◈ .del / .delete
> Borra un mensaje respondido (Requiere ser Admin).[cite: 1]

◈ .setgpbanner / .setgroupimg / .setppgc
> Cambia la imagen o el banner del grupo.[cite: 1]

◈ .setgpdesc / .descgrupo
> Cambia la descripción del grupo.[cite: 1]

《✧》 *CONTENIDO +18*

◈ .nsfwmenu
> Accede al menú completo de comandos restringidos.[cite: 1]

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
