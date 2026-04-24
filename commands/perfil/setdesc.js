module.exports = {
  name: 'setdesc',
  aliases: ['setdescription'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Debes especificar una descripción.` }, { quoted: m });
    
    // GUARDAR DIRECTO EN MONGO
    await User.updateOne({ jid: sender }, { $set: { description: text } }, { upsert: true });
    
    // Opcional: Actualizar la memoria local para que se vea el cambio sin reiniciar
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].description = text;

    await sock.sendMessage(from, { text: `✎ Se ha establecido tu descripción correctamente.` }, { quoted: m });
  }
};