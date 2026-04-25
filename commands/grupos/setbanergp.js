import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'setgpbanner',
  aliases: ['setppgc', 'setgroupimg'],
  category: 'grupo',
  isAdmin: true,
  botAdmin: true,
  run: async (client, m, from, text, quoted, args, isAdmin, isGroup) => {
    const directImage = m.message?.imageMessage;
    const quotedImage = quoted?.imageMessage;

    const imageMessage = directImage || quotedImage;

    if (!imageMessage) {
      return client.sendMessage(from, { text: '《✧》 Te faltó la imagen o responder a una para cambiar el perfil del grupo.' }, { quoted: m });
    }

    try {
      const stream = await downloadContentFromMessage(imageMessage, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      if (!buffer || buffer.length === 0) {
        return client.sendMessage(from, { text: '《✧》 No se pudo descargar la imagen, pariente.' }, { quoted: m });
      }

      await client.updateProfilePicture(from, buffer);
      await client.sendMessage(from, { text: '✿ La imagen del grupo se actualizó con éxito.' }, { quoted: m });

    } catch (e) {
      console.error("Error al cambiar banner del grupo:", e);
      return client.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al intentar cambiar la imagen.\n> [Error: *${e.message}*]` 
      }, { quoted: m });
    }
  },
};