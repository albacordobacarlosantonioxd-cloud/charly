export default {
  name: "addsticker",
  aliases: ['stickeradd'],
  category: 'stickers',
  run: async (sock, m, from, text, { usedPrefix, command, args }) => {
    try {
      // 1. Verificación de DB
      if (!global.db || !global.db.data) {
          return sock.sendMessage(from, { text: '❌ La base de datos no está disponible.' }, { quoted: m });
      }

      const db = global.db.data;
      const packName = text ? text.trim() : args.join(' ').trim();

      if (!packName) {
        return sock.sendMessage(from, { text: `《✧》 Especifica el nombre del paquete.\nUso: *${usedPrefix + command} NombreDelPack*` }, { quoted: m });
      }

      // 2. Verificación de existencia del pack
      if (!db.stickerspack?.[m.sender]?.packs) {
        return sock.sendMessage(from, { text: '《✧》 No tienes paquetes creados. Crea uno primero con *newpack*.' }, { quoted: m });
      }

      const packs = db.stickerspack[m.sender].packs;
      const pack = packs.find(p => p.name.toLowerCase() === packName.toLowerCase());

      if (!pack) {
        return sock.sendMessage(from, { text: '《✧》 No se encontró un paquete con ese nombre.' }, { quoted: m });
      }

      // 3. Verificación del Sticker citado
      const quoted = m.quoted ? m.quoted : null;
      if (!quoted) {
        return sock.sendMessage(from, { text: '《✧》 Responde a un sticker para agregarlo.' }, { quoted: m });
      }

      // Validar que sea un sticker (webp)
      const mime = quoted.mimetype || '';
      if (!/webp/i.test(mime)) {
        return sock.sendMessage(from, { text: '《✧》 Solo puedes agregar stickers (.webp).' }, { quoted: m });
      }

      if (pack.stickers.length >= 50) {
        return sock.sendMessage(from, { text: '《✧》 El paquete ya está lleno (máximo 50 stickers).' }, { quoted: m });
      }

      // 4. Descarga y Conversión
      let buffer = await quoted.download();
      if (!buffer) {
        return sock.sendMessage(from, { text: '《✧》 Error al descargar el sticker.' }, { quoted: m });
      }

      const base64Sticker = buffer.toString('base64');

      // Evitar duplicados
      if (pack.stickers.includes(base64Sticker)) {
        return sock.sendMessage(from, { text: `《✧》 Este sticker ya está en el paquete \`${pack.name}\`.` }, { quoted: m });
      }

      // 5. Guardar en DB
      pack.stickers.push(base64Sticker);
      pack.lastModified = Date.now().toString();
      db.stickerspack[m.sender].packs = packs;

      await sock.sendMessage(from, { text: `✅ ¡Sticker agregado al pack \`${pack.name}\` correctamente!` }, { quoted: m });

    } catch (e) {
      console.error("Error en addsticker:", e);
      sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  }
};
