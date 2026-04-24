module.exports = {
  name: 'sethobby',
  aliases: ['setpasatiempo'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Escribe tu pasatiempo favorito.` }, { quoted: m });
    
    await User.updateOne({ jid: sender }, { $set: { hobby: text } }, { upsert: true });
    
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].hobby = text; 

    await sock.sendMessage(from, { text: `✐ Se ha establecido tu pasatiempo: *${text}*` }, { quoted: m });
  }
};