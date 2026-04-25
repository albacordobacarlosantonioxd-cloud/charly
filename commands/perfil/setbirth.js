import { User } from "../../index.js";

export default {
  name: 'setbirth',
    category: 'perfil',
  aliases: ['setcumple'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    const sender = m.sender;
    if (!text) return await sock.sendMessage(from, { 
        text: `《✧》 Escribe tu fecha de nacimiento.\n\n✐ *Ejemplo:* .setbirth 15 de Octubre` 
    }, { quoted: m });

    try {
        // 1. Guardamos DIRECTO en la base de datos usando el modelo 'User'
        await User.updateOne(
            { jid: sender }, 
            { $set: { birth: text } }, 
            { upsert: true }
        );

        // No es necesario actualizar db.users[sender] si solo usas el modelo de Mongoose
        // Si db es una representación en memoria, entonces sí, pero si no se usa, es redundante.

        await sock.sendMessage(from, { 
            text: `🎂 ¡Listo! Tu fecha de nacimiento se ha guardado como: *${text}*\n\n> Ahora aparecerá en tu .perfil para siempre.` 
        }, { quoted: m });
        
    } catch (e) {
        console.error("Error al guardar en MongoDB:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un error al conectar con la base de datos.' }, { quoted: m });
    }
  }
};