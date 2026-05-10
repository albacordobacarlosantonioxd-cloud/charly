export default {
    name: 'menu',
    category: 'herramientas',
    aliases: ['help', 'h', 'comandos'],
    run: async (sock, m, from, text, { usedPrefix, commands }) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DE COMANDOS* ✨
> *Prefijo:* [ ${usedPrefix} ]

《✧》 *INTELIGENCIA ARTIFICIAL*
◈ ${usedPrefix}gpt4
╰ _Chat con GPT-4 avanzado._
◈ ${usedPrefix}claude
╰ _Chat con la IA de Anthropic._
◈ ${usedPrefix}gemini
╰ _IA potente de Google._
◈ ${usedPrefix}copilot
╰ _Asistente inteligente de Microsoft._
◈ ${usedPrefix}flux
╰ _Generador de imágenes realista._
◈ ${usedPrefix}nanobanana
╰ _IA especializada en generación visual._
◈ ${usedPrefix}iarealistic
╰ _Crea fotos con realismo extremo._
◈ ${usedPrefix}ia
╰ _Consultas generales con IA._
◈ ${usedPrefix}imagine
╰ _Crea arte digital desde texto._
◈ ${usedPrefix}vozmujer
╰ _Texto a voz con acento mexicano._

《✧》 *DESCARGAS*
◈ ${usedPrefix}video
╰ _Descarga videos de YouTube en MP4._
◈ ${usedPrefix}audio
╰ _Descarga música de YouTube en MP3._
◈ ${usedPrefix}tiktok
╰ _Videos de TikTok sin marca de agua._
◈ ${usedPrefix}spotify
╰ _Descarga canciones de Spotify._
◈ ${usedPrefix}dezer
╰ _Descarga música desde Deezer._
◈ ${usedPrefix}mediafire
╰ _Descarga archivos de Mediafire._
◈ ${usedPrefix}socialdl
╰ _Descarga videos de redes sociales._
◈ ${usedPrefix}apksrh
╰ _Buscador de aplicaciones APK._
◈ ${usedPrefix}pinterest
╰ _Busca imágenes en Pinterest._
◈ ${usedPrefix}googleimg
╰ _Buscador de imágenes en Google._

《✧》 *HERRAMIENTAS & EDICIÓN*
◈ ${usedPrefix}sticker
╰ _Convierte imagen o video a sticker._
◈ ${usedPrefix}wm
╰ _Cambia el nombre de tus stickers._
◈ ${usedPrefix}hd
╰ _Mejora la resolución de tus fotos._
◈ ${usedPrefix}rbg
╰ _Elimina el fondo de cualquier foto._
◈ ${usedPrefix}bratt
╰ _Crea stickers con texto estilo Bratt._
◈ ${usedPrefix}brattv
╰ _Stickers con texto con movimiento._
◈ ${usedPrefix}comprimir
╰ _Reduce el peso de tus archivos._
◈ ${usedPrefix}pdf
╰ _Convierte tus fotos en un PDF._
◈ ${usedPrefix}translate
╰ _Traductor de idiomas en tiempo real._
◈ ${usedPrefix}letra
╰ _Busca la letra de tus canciones._
◈ ${usedPrefix}tempmail
╰ _Genera un correo temporal rápido._
◈ ${usedPrefix}pfp
╰ _Obtén la foto de perfil de alguien._
◈ ${usedPrefix}ping
╰ _Mira la velocidad de respuesta del bot._

《✧》 *ADMINISTRACIÓN GRUPAL*
◈ ${usedPrefix}tag
╰ _Menciona a todos los miembros._
◈ ${usedPrefix}admins
╰ _Menciona solo a los administradores._
◈ ${usedPrefix}kick
╰ _Elimina a un usuario del grupo._
◈ ${usedPrefix}promote
╰ _Dale administrador a un usuario._
◈ ${usedPrefix}demote
╰ _Quítale el administrador a alguien._
◈ ${usedPrefix}open
╰ _Abre el grupo para que todos hablen._
◈ ${usedPrefix}close
╰ _Cierra el grupo solo para admins._
◈ ${usedPrefix}link
╰ _Obtén el enlace de invitación._
◈ ${usedPrefix}del
╰ _Borra mensajes de otras personas._
◈ ${usedPrefix}setgpdesc
╰ _Cambia la descripción del grupo._

《✧》 *PERFIL & ECONOMÍA*
◈ ${usedPrefix}profile
╰ _Mira tu tarjeta de usuario de Charly-Bot._
◈ ${usedPrefix}work
╰ _Trabaja para ganar dinero en el bot._
◈ ${usedPrefix}balance
╰ _Consulta cuánto dinero tienes ahorrado._
◈ ${usedPrefix}daily
╰ _Reclama tu recompensa diaria._
◈ ${usedPrefix}marry
╰ _Pídele matrimonio a otro usuario._
◈ ${usedPrefix}divorciarse
╰ _Termina tu relación actual._
◈ ${usedPrefix}setdesc
╰ _Personaliza tu descripción de perfil._
◈ ${usedPrefix}sethobby
╰ _Añade tus pasatiempos al perfil._
◈ ${usedPrefix}setbirth
╰ _Configura tu fecha de cumpleaños._

> _Comandos totales: ${commands.size}_
> _Propiedad de Charly_`;

        try {
            await sock.sendMessage(from, { 
                image: { url: imagenMenu }, 
                caption: menuCaption 
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(from, { text: menuCaption }, { quoted: m });
        }
    }
};
