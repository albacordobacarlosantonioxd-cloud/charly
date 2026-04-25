export default {
  name: 'link',
  aliases: ['enlace', 'invitacion'],
  category: 'grupo',
  botAdmin: true,
  run: async (client, m, from, text, quoted, args, isAdmin, isGroup) => {
    try {
      if (!isGroup) return client.sendMessage(from, { text: "❌ Este comando solo funciona en grupos, pariente." }, { quoted: m });

      const code = await client.groupInviteCode(from);
      const link = `https://chat.whatsapp.com/${code}`;

      const teks = `﹒⌗﹒🌿 .ৎ˚₊‧  Aquí tienes el link del grupo:\n\n𐚁 ֹ ִ \`GROUP LINK\` ! ୧ ֹ ִ🔗\n☘️ \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n🌱 \`Enlace :\` ${link}`;

      await client.sendMessage(from, { 
        text: teks, 
        mentions: [m.sender] 
      }, { quoted: m });

    } catch (e) {
      console.error("Error al obtener link:", e);
      await client.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al intentar obtener el enlace.\n> [Error: *${e.message}*]\n\n_Asegúrate de que el bot sea administrador._` 
      }, { quoted: m });
    }
  },
};