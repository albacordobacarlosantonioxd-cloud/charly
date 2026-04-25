export default {
  name: 'kick',
  aliases: ['sacar', 'eliminar'],
  category: 'grupo',
  isAdmin: true,
  botAdmin: true,
    run: async (client, m, from, text, quoted, args, isAdmin, isGroup, sender) => {
    const normalizedSender = sender ? (sender.split(':')[0] + '@s.whatsapp.net') : '';
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentionedJid[0] && !quoted) {
      return client.sendMessage(from, { text: '《✧》 Etiqueta o responde al *mensaje* de la *persona* que quieres eliminar' }, { quoted: m });
    }

    let user = mentionedJid[0] ? mentionedJid[0] : (quoted ? (quoted.key?.participant || quoted.key?.remoteJid) : null);
    const normalizedUser = user ? (user.split(':')[0] + '@s.whatsapp.net') : '';

    try {
      const groupInfo = await client.groupMetadata(from);
      const myNumber = '82906290606190@s.whatsapp.net'; 
      const ownerGroup = groupInfo.owner ? (groupInfo.owner.split(':')[0] + '@s.whatsapp.net') : (from.split('-')[0] + '@s.whatsapp.net');

      const participant = groupInfo.participants.find((p) => {
        const normalizedP = p.id ? (p.id.split(':')[0] + '@s.whatsapp.net') : '';
        const normalizedLid = p.lid ? (p.lid.split(':')[0] + '@s.whatsapp.net') : '';
        return normalizedP === normalizedUser || normalizedLid === normalizedUser;
      });
      
      if (!participant) {
        return client.sendMessage(from, { 
          text: `《✧》 *@${normalizedUser.split('@')[0]}* ya no está en el grupo.`, 
          mentions: [user] 
        }, { quoted: m });
      }

      const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
      
      if (normalizedUser === botId) {
        return client.sendMessage(from, { text: '《✧》 No puedo eliminar al *bot* del grupo' }, { quoted: m });
      }
      if (normalizedUser === ownerGroup) {
        return client.sendMessage(from, { text: '《✧》 No puedo eliminar al *propietario* del grupo' }, { quoted: m });
      }
      if (normalizedUser === myNumber) {
        return client.sendMessage(from, { text: '《✧》 No puedo eliminar a mi *creador*.' }, { quoted: m });
      }

      await client.groupParticipantsUpdate(from, [user], 'remove');
      
      return client.sendMessage(from, { 
        text: `✎ @${user.split('@')[0]} *eliminado* correctamente`, 
        mentions: [user] 
      }, { quoted: m });

    } catch (e) {
      console.error(e);
      return client.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al ejecutar el comando.\n> [Error: *${e.message}*]` 
      }, { quoted: m });
    }
  },
};