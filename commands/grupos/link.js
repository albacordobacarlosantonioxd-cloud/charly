export default {
  name: 'link',
  aliases: ['enlace', 'invitacion'],
  category: 'grupos',
  run: async (sock, m, from, text, { isAdmin, isGroup, botAdmin }) => {
    try {
      // 1. Verificación de Grupo
      if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos, pariente." }, { quoted: m });

      // 2. Verificación de Admin (Tanto el usuario como el bot)
      if (!isAdmin) return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden pedir el enlace del grupo." }, { quoted: m });
      if (!botAdmin) return sock.sendMessage(from, { text: "❌ Necesito ser administrador para generar el enlace." }, { quoted: m });

      // 3. Obtener el código
      const code = await sock.groupInviteCode(from);
      const link = `https://chat.whatsapp.com/${code}`;

      const teks = `﹒⌗﹒🌿 .ৎ˚₊‧  Aquí tienes el link del grupo:\n\n𐚁 ֹ ִ \`GROUP LINK\` ! ୧ ֹ ִ🔗\n☘️ \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n🌱 \`Enlace :\` ${link}`;

      await sock.sendMessage(from, { 
        text: teks, 
        mentions: [m.sender] 
      }, { quoted: m });

    } catch (e) {
      console.error("Error al obtener link:", e);
      await sock.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al intentar obtener el enlace.\n> [Error: *${e.message}*]\n\n_Asegúrate de que el bot sea administrador._` 
      }, { quoted: m });
    }
  },
};
