// 1. IMPORTACIONES (Ajusta las rutas según tu carpeta)
import { db, User } from '../../index.js';
import saveDB from '../../utils/saveDB.js';

export default {
    name: 'sethobby',
    aliases: ['setpasatiempo'],
    category: 'rpg',
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        const sender = m.sender; // <--- Faltaba definir quién es el sender

        if (!text) return await sock.sendMessage(from, { text: `《✧》 Escribe tu pasatiempo favorito.` }, { quoted: m });

        try {
            // 2. ACTUALIZACIÓN EN MONGODB ATLAS
            await User.updateOne(
                { jid: sender }, 
                { $set: { hobby: text } }, 
                { upsert: true }
            );

            // 3. ACTUALIZACIÓN EN LA RAM (global.db)
            if (!db.users[sender]) {
                db.users[sender] = { jid: sender, hobby: text };
            } else {
                db.users[sender].hobby = text;
            }

            // 4. GUARDADO (Opcional si tu saveDB lo requiere)
            if (typeof saveDB === 'function') {
                await saveDB(sender);
            }

            await sock.sendMessage(from, { 
                text: `✐ Se ha establecido tu pasatiempo: *${text}*` 
            }, { quoted: m });

        } catch (e) {
            console.error("Error en sethobby:", e);
            await sock.sendMessage(from, { text: '❌ Error al conectar con la base de datos.' }, { quoted: m });
        }
    }
};