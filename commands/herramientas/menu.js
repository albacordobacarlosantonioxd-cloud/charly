export default {
    name: 'menu',
    run: async (sock, m, from, text, quoted) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DE COMANDOS* ✨

《✧》 *INTELIGENCIA ARTIFICIAL*

◈ .copilot / .cop
> Consulta a la IA de Microsoft para código y tareas.

◈ .ia / .bot / .groq / .pregunta
> Chat general con la inteligencia principal del bot (memoria incluida).

◈ .gemini / .gemi / .chatgpt / .google
> Habla directamente con la IA de Google Gemini 2.5 Flash.

◈ .flux
> Generador avanzado de imágenes realistas con IA.

◈ .letra / .lyrics / .l
> Busca la letra completa de cualquier canción.

◈ .responde / .tarea / .soluciona
> Resuelve tareas o trabajos enviando una foto o video.

◈ .ayuda
> Pide asistencia con problemas específicos (describe imagen/video).

《✧》 *MULTIMEDIA & DOWNLOAD*

◈ .audio / .ytaudio
> Descarga música de YouTube en formato MP3.

◈ .video / .ytvideo
> Descarga videos de YouTube en formato MP4 (límite 1h 20min).

◈ .tiktok / .tt
> Busca y descarga videos de TikTok sin marca de agua.

◈ .ytsearch / .yt / .youtube / .buscar
> Busca videos en YouTube y muestra los 5 mejores resultados.

《✧》 *HERRAMIENTAS & UTILIDADES*

◈ .ping / .p
> Muestra la latencia y velocidad de respuesta del bot.

◈ .sticker / .s
> Crea stickers a partir de imagen o video.

◈ .brat
> Genera stickers con el diseño estilo "Brat".

◈ .tts / .audiotexto / .decir
> Convierte texto a audio/nota de voz en español.

◈ .hd
> Mejora la calidad de una imagen respondida (upscale x2).

◈ .separate / .vocal / .separe
> Separa la voz y la pista instrumental de un audio.

◈ .kiss / .hug / .slap
> Interacciones con GIFs animados (menciona a alguien).

《✧》 *PERFIL & RPG*

◈ .profile / .perfil
> Muestra tu perfil con estadísticas, nivel, dinero y más.

◈ .work / .w / .chambear / .chamba / .trabajar
> Trabaja para ganar dinero (cooldown de 3 minutos).

◈ .setdesc / .setdescription
> Establece tu descripción de perfil.

◈ .deldesc
> Elimina tu descripción de perfil.

◈ .setbirth / .setcumple
> Establece tu fecha de nacimiento.

◈ .setgenre / .setgenero
> Establece tu género (Hombre, Mujer, Binario).

◈ .delgenre
> Elimina tu género del perfil.

◈ .sethobby / .setpasatiempo
> Establece tu pasatiempo favorito.

◈ .delhobby
> Elimina tu pasatiempo del perfil.

◈ .marry / .casarse / .proponer
> Propón matrimonio a un usuario (responde o menciona).

◈ .divorce / .divorcio
> Divórciate de tu pareja actual.

《✧》 *ADMINISTRACIÓN DE GRUPOS*

◈ .close
> Cierra el grupo (solo admins pueden escribir).

◈ .open
> Abre el grupo (todos pueden escribir).

◈ .kick / .sacar / .eliminar
> Expulsa a un usuario del grupo (menciona o responde).

◈ .promote
> Promueve a un usuario a administrador.

◈ .demote
> Degrada a un usuario de administrador.

◈ .link / .enlace / .invitacion
> Obtiene el link de invitación del grupo.

◈ .tag
> Menciona a todos los miembros del grupo (hidetag).

◈ .del / .delete
> Borra un mensaje respondido (requiere ser admin).

◈ .setgpbanner / .setppgc / .setgroupimg
> Cambia la imagen/banner del grupo.

◈ .setgpdesc / .setdesc / .descgrupo
> Cambia la descripción del grupo.

《✧》 *CONTENIDO +18*

◈ .nsfwmenu
> Accede al menú completo de comandos NSFW restringidos.

> _Usa cada comando de manera responsable._`;

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
