export default {
  name: 'link',
  aliases: ['enlace', 'invitacion'],
  category: 'grupos',
  run: async (sock, m, from, text, { isGroup }) => {
    try {
      // Única verificación: que sea un grupo
      if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos, pariente." }, { quoted: m });

      // Obtener el código directamente
      const code = await sock.groupInviteCode(from);
      const link = `https://chat.whatsapp.com/${code}`;

      const teks = `﹒⌗﹒🌿 .ৎ˚₊‧  Aquí tienes el link del grupo:\n\n𐚁 ֹ ִ \`GROUP LINK\` ! ୧ ֹ ִ🔗\n☘️ \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n🌱 \`Enlace :\` ${link}`;

      await sock.sendMessage(from, { 
        text: teks, 
        mentions: [m.sender] 
      }, { quoted: m });

    } catch (e) {
      console.error("Error al obtener link:", e);
      // Si falla aquí, casi seguro es porque el bot NO es admin
      await sock.sendMessage(from, { 
        text: `❌ *Error:* No pude generar el enlace. \n\n> 💡 _Asegúrate de que el bot sea administrador del grupo para que WhatsApp me dé permiso de ver el link._` 
      }, { quoted: m });
    }
  },
};
