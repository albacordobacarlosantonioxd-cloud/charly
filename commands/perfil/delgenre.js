import { db } from '../../index.js';
import saveDB from '../../utils/saveDB.js';

export default {
  name: 'delgenre',
    category: 'perfil',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    const sender = m.sender;
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].gender = ''; 
    await saveDB(sender); 
    await sock.sendMessage(from, { text: '✎ Género eliminado.' }, { quoted: m }); 
  }
};
