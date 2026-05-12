import fs from 'fs';

export default {
  name: "getpack",
  aliases: ['pack', 'stickerpack'],
  category: 'stickers',
  run: async (sock, m, from, text, { usedPrefix, command, args }) => {
    try {
      const packName = text ? text.trim().toLowerCase() : args.join(' ').trim().toLowerCase();
      
      if (!packName) {
        return sock.sendMessage(from, { text: '《✧》 Especifica el nombre del paquete de stickers.' }, { quoted: m });
      }

      const db = global.db.data;
      if (!db.stickerspack) db.stickerspack = {};

      let pack = null;
      let packOwner = m.sender;

      // 1. Buscar en mis propios packs
      const myPacks = db.stickerspack[m.sender]?.packs || [];
      pack = myPacks.find(p => p.name.toLowerCase() === packName);

      // 2. Si no es mío, buscar en packs públicos de otros
      if (!pack) {
        for (const [userId, userData] of Object.entries(db.stickerspack)) {
          const userPacks = userData.packs || [];
          const publicPack = userPacks.find(p => p.name.toLowerCase() === packName && p.spackpublic === 1);
          if (publicPack) {
            pack = publicPack;
            packOwner = userId;
            break;
          }
        }
      }

      if (!pack) {
        return sock.sendMessage(from, { text: '《✧》 No se encontró un paquete con ese nombre o es privado.' }, { quoted: m });
      }

      if (!Array.isArray(pack.stickers) || pack.stickers.length < 1) {
        return sock.sendMessage(from, { text: `《✧》 El paquete \`${pack.name}\` está vacío.` }, { quoted: m });
      }

      // 3. Convertir Base64 a Buffers válidos
      const validStickers = pack.stickers.map(s => {
        try { return Buffer.from(s, 'base64'); } catch { return null; }
      }).filter(s => s && Buffer.isBuffer(s) && s.length > 0);

      if (validStickers.length === 0) {
        return sock.sendMessage(from, { text: '《✧》 Los stickers de este paquete están corruptos.' }, { quoted: m });
      }

      await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

      const MAX_STICKERS = 50;
      const selected = validStickers.slice(0, MAX_STICKERS);
      const cover = selected[0];

      // Metadatos del autor
      const packOwnerUser = db.users[packOwner] || {};
      const ownerName = packOwnerUser.name || packOwner.split('@')[0];
      
      // Ajuste de nombres y autor para el EXIF
      const stickerPackname = pack.name;
      const stickerAuthor = `By: ${ownerName} ⚡ CHARLY-BOT`;

      // 4. Inyectar Metadatos (Exif) usando node-webpmux
      const webp = await import('node-webpmux');
      const stickerResults = await Promise.all(selected.map(async (buffer) => {
        try {
          const img = new webp.default.Image();
          await img.load(buffer);
          
          const json = { 
            'sticker-pack-id': `charly-pack-${Date.now()}`, 
            'sticker-pack-name': stickerPackname, 
            'sticker-pack-publisher': stickerAuthor, 
            'emojis': ['🎭'] 
          };
          
          const exifAttr = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
          const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
          const exif = Buffer.concat([exifAttr, jsonBuff]);
          exif.writeUIntLE(jsonBuff.length, 14, 4);
          
          img.exif = exif;
          
          // Crear carpeta tmp si no existe
          if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
          
          const tmpOut = `./tmp/pack-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
          await img.save(tmpOut);
          const stickerBuf = fs.readFileSync(tmpOut);
          fs.unlinkSync(tmpOut); // Borrar archivo temporal
          
          return { sticker: stickerBuf };
        } catch (e) {
          return { sticker: buffer }; // Si falla el meta, mandar el original
        }
      }));

      // 5. Enviar el paquete completo
      // Nota: 'stickerPack' es una función de mensaje masivo en algunas versiones de Baileys
      // Si tu versión no lo soporta, se deben enviar uno por uno en un loop.
      await sock.sendMessage(from, { 
        text: `📦 *ENVIANDO PACK:* ${pack.name}\n✨ *Autor:* ${ownerName}\n📋 *Cantidad:* ${selected.length} stickers.` 
      }, { quoted: m });

      for (const res of stickerResults) {
        await sock.sendMessage(from, { sticker: res.sticker }, { quoted: m });
        // Pequeño delay para no saturar la conexión
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await sock.sendMessage(from, { react: { text: '✔️', key: m.key } });

    } catch (e) {
      console.error("Error en getpack:", e);
      await sock.sendMessage(from, { react: { text: '✖️', key: m.key } });
      sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  }
};
