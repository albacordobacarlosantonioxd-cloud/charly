module.exports = {
  name: 'delhobby',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    db.users[sender].hobby = ''; 
    await saveDB(sender); 
    m.reply('✎ Pasatiempo eliminado.'); 
  }
};