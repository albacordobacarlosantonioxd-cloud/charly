module.exports = {
  name: 'afk',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].afk = Date.now();
    db.users[sender].afkReason = text || 'Sin especificar';
    
    await saveDB(sender); // Muy importante para que no se quite el AFK si el bot se reinicia
    
    m.reply(`ꕥ Estarás AFK.\n> ○ Motivo » *${db.users[sender].afkReason}*`);
  }
};