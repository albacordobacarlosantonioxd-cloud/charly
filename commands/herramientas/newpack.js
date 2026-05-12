export default {
  name: "newpack",
  aliases: ['newstickerpack'],
  category: 'stickers',
  // Extraemos lo necesario del paquete extra (quinto parámetro)
  run: async (sock, m, from, text, { usedPrefix, command, args }) => {
    try {
      // Verificamos si la base de datos global existe
      if (!global.db || !global.db.data) {
          return sock.sendMessage(from, { text: '❌ La base de datos no está conectada. Intenta más tarde.' }, { quoted: m });
      }

      const db = global.db.data;
      
      // Inicializamos los objetos si no existen para evitar errores de "undefined"
      if (!db.users) db.users = {};
      if (!db.stickerspack) db.stickerspack = {};
      if (!db.stickerspack[m.sender]) db.stickerspack[m.sender] = { packs: [] };

      const user = db.users[m.sender] || {};
      const dev = user.name || m.pushName || 'Usuario';
      
      const name = text ? text.trim() : args.join(' ').trim();

      if (!name || name.length < 4 || name.length > 64) {
        return sock.sendMessage(from, { text: `《✧》 El nombre del paquete de stickers debe tener entre 4 y 64 caracteres.\n\nUso: *${usedPrefix + command} Mi Paquete*` }, { quoted: m });
      }

      const packs = db.stickerspack[m.sender].packs || [];

      // Revisar si ya existe el nombre
      if (packs.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        return sock.sendMessage(from, { text: '《✧》 Ya tienes un paquete con ese nombre.' }, { quoted: m });
      }

      // Crear el nuevo paquete
      const newPack = { 
          id: Date.now().toString(), 
          lastModified: Date.now().toString(), 
          name, 
          author: 'CHARLY-BOT', // Aquí puse el nombre de tu bot
          desc: `Paquete de stickers creado por ${dev}`, 
          stickers: [], 
          spackpublic: 0 
      };

      packs.push(newPack);
      db.stickerspack[m.sender].packs = packs;

      // Si usas un sistema que requiere guardar manualmente el JSON:
      // if (global.db.write) await global.db.write();

      await sock.sendMessage(from, { 
          text: `《✧》 ¡El paquete de stickers \`${name}\` ha sido creado exitosamente!\n\n> Puedes agregar stickers respondiendo a uno usando: \n> *${usedPrefix}addsticker ${name}*` 
      }, { quoted: m });

    } catch (e) {
      console.error("Error en newpack:", e);
      sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  }
};
