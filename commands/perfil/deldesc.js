module.exports = {
  name: 'deldesc',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    db.users[sender].description = ''; 
    await saveDB(sender); 
    m.reply('✎ Descripción eliminada.'); 
  }
};