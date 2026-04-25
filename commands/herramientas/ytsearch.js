import yts from 'yt-search';

export default {
  name: 'ytsearch',
  aliases: ['yt', 'youtube', 'buscar'],
  category: 'utilidad',
  run: async (sock, m, from, text, quoted) => {
    // 1. Validar que el usuario haya puesto un término de búsqueda
    if (!text) {
      return sock.sendMessage(from, { text: '《✧》 ¿Qué quieres buscar en YouTube, pariente?' }, { quoted: m });
    }

    try {
      // 2. Realizar la búsqueda en YouTube
      const search = await yts(text);
      const videos = search.videos.slice(0, 5); // Tomamos los primeros 5 resultados

      if (videos.length === 0) {
        return sock.sendMessage(from, { text: '❌ No encontré nada, intenta con otro nombre.' }, { quoted: m });
      }

      // 3. Construir el cuerpo del mensaje
      let mensaje = `🎬 *RESULTADOS DE YOUTUBE*\n\n`;
      
      videos.forEach((vid, i) => {
        mensaje += `*${i + 1}.* ${vid.title}\n`;
        mensaje += `⌚ *Duración:* ${vid.timestamp}\n`;
        mensaje += `👁️ *Vistas:* ${vid.views.toLocaleString()}\n`;
        mensaje += `🔗 *Link:* ${vid.url}\n\n`;
      });

      mensaje += `> _Mostrando los primeros 5 resultados._`;

      // 4. Enviar la imagen del primer video junto con el texto
      const thumbUrl = videos[0]?.thumbnail;
      if (!thumbUrl) {
        return sock.sendMessage(from, { text: mensaje }, { quoted: m });
      }

      await sock.sendMessage(from, {
        image: { url: thumbUrl },
        caption: mensaje,
        mentions: m.sender ? [m.sender] : []
      }, { quoted: m });

      console.log(`[📺] Búsqueda de YT exitosa para: ${text}`);

    } catch (e) {
      console.error("Error en ytsearch:", e);
      await sock.sendMessage(from, { text: '❌ Valio barriga, no pude conectar con YouTube.' }, { quoted: m });
    }
  }
};