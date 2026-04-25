import { User } from "../../index.js";

export default {
  name: 'setdesc',
    category: 'perfil',
  aliases: ['setdescription'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    const sender = m.sender;
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Debes especificar una descripción.` }, { quoted: m });
    
    try {
        // GUARDAR DIRECTO EN MONGO
        await User.updateOne({ jid: sender }, { $set: { description: text } }, { upsert: true });
        
        // Opcional: Actualizar la memoria local para que se vea el cambio sin reiniciar
        // if (!db.users[sender]) db.users[sender] = {};
        // db.users[sender].description = text;

        await sock.sendMessage(from, { text: `✎ Se ha establecido tu descripción correctamente.` }, { quoted: m });
    } catch (e) {
        console.error("Error al guardar la descripción en MongoDB:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un error al conectar con la base de datos.' }, { quoted: m });
    }
  }
};