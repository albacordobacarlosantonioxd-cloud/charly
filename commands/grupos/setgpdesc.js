export default {
  name: 'setgpdesc',
  aliases: ['setdesc', 'descgrupo'],
  category: 'grupo',
  isAdmin: true,
  botAdmin: true,
  run: async (client, m, from, text, quoted, args, isAdmin, isGroup) => {
    const newDesc = args.join(' ').trim();

    if (!newDesc) {
      return client.sendMessage(from, { text: '《✧》 Por favor, ingresa la nueva descripción que deseas ponerle al grupo.' }, { quoted: m });
    }

    try {
      await client.groupUpdateDescription(from, newDesc);
      await client.sendMessage(from, { text: '✿ La descripción del grupo se modificó correctamente.' }, { quoted: m });

    } catch (e) {
      console.error("Error al cambiar descripción:", e);
      return client.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al intentar cambiar la descripción.\n> [Error: *${e.message}*]` 
      }, { quoted: m });
    }
  },
};