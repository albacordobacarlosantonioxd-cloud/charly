import { db } from '../../index.js';
import saveDB from '../../utils/saveDB.js';

export default {
  name: 'deldesc',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    const sender = m.sender;
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].description = ''; 
    await saveDB(sender); 
    await sock.sendMessage(from, { text: '✎ Descripción eliminada.' }, { quoted: m }); 
  }
};
