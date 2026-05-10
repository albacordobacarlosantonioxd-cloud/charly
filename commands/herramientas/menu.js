export default {
    name: 'menu',
    category: 'herramientas',
    aliases: ['help', 'h', 'comandos'],
    run: async (sock, m, from, text, { usedPrefix }) => {
        const imagenMenu = 'https://i.postimg.cc/rsLZrVxy/mi-imagen-del-menu.png'; 

        const menuCaption = `❀ *CHARLY-BOT MAESTRO V2* ❀

> ✨ *SISTEMA DE COMANDOS* ✨
> *Prefijo:* [ ${usedPrefix} ]

《✧》 *INTELIGENCIA ARTIFICIAL*
◈ ${usedPrefix}gpt4 ➜ Chat con GPT-4 avanzado.
◈ ${usedPrefix}gemini ➜ IA potente de Google.
◈ ${usedPrefix}flux ➜ Genera imágenes realistas.
◈ ${usedPrefix}iaimg ➜ Crea arte digital con IA.
◈ ${usedPrefix}vozmujer ➜ Texto a audio (Voz Mexicana).

《✧》 *MULTIMEDIA & DOWNLOAD*
◈ ${usedPrefix}video ➜ Descarga videos de YouTube.
◈ ${usedPrefix}audio ➜ Descarga música en MP3.
◈ ${usedPrefix}tiktok ➜ Videos de TT sin marca de agua.
◈ ${usedPrefix}spotify ➜ Descarga canciones de Spotify.
◈ ${usedPrefix}apk ➜ Busca y descarga apps MOD.
◈ ${usedPrefix}mediafire ➜ Descarga archivos de MF.
◈ ${usedPrefix}pinterest ➜ Busca imágenes en Pinterest.

《✧》 *HERRAMIENTAS & EDIT*
◈ ${usedPrefix}sticker ➜ Convierte imagen/video a sticker.
◈ ${usedPrefix}hd ➜ Mejora la calidad de tus fotos.
◈ ${usedPrefix}bratt ➜ Stickers con texto estilo Bratt.
◈ ${usedPrefix}pdf ➜ Convierte imágenes a PDF.
◈ ${usedPrefix}removebg ➜ Quita el fondo de tus imágenes.
◈ ${usedPrefix}translate ➜ Traductor de varios idiomas.

《✧》 *GRUPOS & ADMIN*
◈ ${usedPrefix}tag ➜ Menciona a todos los del grupo.
◈ ${usedPrefix}kick ➜ Elimina a un usuario (Admins).
◈ ${usedPrefix}link ➜ Obtiene el enlace del grupo.
◈ ${usedPrefix}del ➜ Borra mensajes (Admins).
◈ ${usedPrefix}open ➜ Abre el grupo para todos.
◈ ${usedPrefix}close ➜ Cierra el grupo (Solo Admins).

《✧》 *PERFIL & ECONOMÍA*
◈ ${usedPrefix}profile ➜ Mira tu tarjeta de usuario.
◈ ${usedPrefix}work ➜ Trabaja para ganar dinero.
◈ ${usedPrefix}marry ➜ Cásate con otro usuario.
◈ ${usedPrefix}balance ➜ Mira tu dinero disponible.
◈ ${usedPrefix}setdesc ➜ Cambia tu descripción de perfil.

> _Propiedad de Charly_`;

        try {
            await sock.sendMessage(from, { 
                image: { url: imagenMenu }, 
                caption: menuCaption 
            }, { quoted: m });
        } catch (e) {
            console.error("Error al enviar el menú:", e);
            await sock.sendMessage(from, { text: menuCaption }, { quoted: m });
        }
    }
};
