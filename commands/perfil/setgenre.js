import { User } from "../../index.js";

export default {
  name: 'setgenre',
  aliases: ['setgenero'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    const sender = m.sender;
    // 1. Verificamos que el usuario elija una opción
    if (!text) return await sock.sendMessage(from, { 
        text: `《✧》 Elige tu género.\n\n*Opciones:* .setgenre Hombre | Mujer | Binario` 
    }, { quoted: m });

    // Normalizamos el texto (Primera letra Mayúscula, lo demás minúscula)
    const generoValido = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    try {
        // 2. Guardamos DIRECTO en MongoDB usando el modelo 'User'
        await User.updateOne(
            { jid: sender }, 
            { $set: { gender: generoValido } }, 
            { upsert: true }
        );

        // 3. Actualizamos la memoria RAM (db.users) - solo si es necesario y db está definido y se usa.
        // if (!db.users[sender]) db.users[sender] = {};
        // db.users[sender].gender = generoValido;

        // 4. Mensaje de confirmación
        await sock.sendMessage(from, { 
            text: `✨ ¡Listo! Tu género se ha actualizado a: *${generoValido}*\n\n> Ya puedes verlo en tu .perfil` 
        }, { quoted: m });
        
    } catch (e) {
        console.error("Error al guardar género en Mongo:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un error al conectar con la base de datos.' }, { quoted: m });
    }
  }
};