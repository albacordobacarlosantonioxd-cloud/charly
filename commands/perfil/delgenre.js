module.exports = {
  name: 'delgenre',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    db.users[sender].gender = ''; 
    await saveDB(sender); 
    m.reply('✎ Género eliminado.'); 
  }
};