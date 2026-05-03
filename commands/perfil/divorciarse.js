import { User } from "../../index.js"; // Ajusta la ruta a donde exportas tu modelo

export default {
  command: ['divorce', 'divorcio'],
  category: 'perfil',
  run: async (sock, m, from) => {
    const userId = m.sender;

    try {
        // 1. Buscamos al usuario en MongoDB
        const user = await User.findOne({ jid: userId });
        const partnerId = user?.marry;

        // Si no tiene pareja en el campo marry de Mongo
        if (!partnerId || partnerId === "" || partnerId === null) {
            return sock.sendMessage(from, { text: '《✧》 Tú no estás casado con nadie, pariente.' }, { quoted: m });
        }

        // 2. Buscamos datos de la pareja para el mensaje
        const partner = await User.findOne({ jid: partnerId });
        const nameUser = user?.name || userId.split('@')[0];
        const namePartner = partner?.name || partnerId.split('@')[0];

        // 3. ACTUALIZACIÓN EN MONGO ATLAS
        // Limpiamos a ambos de un solo golpe
        await User.updateOne({ jid: userId }, { $set: { marry: null, marryName: 'Nadie' } });
        await User.updateOne({ jid: partnerId }, { $set: { marry: null, marryName: 'Nadie' } });

        // 4. Sincronizamos la RAM (global.db.data) por si tu perfil lee de ahí
        if (global.db && global.db.data && global.db.data.users) {
            if (global.db.data.users[userId]) {
                global.db.data.users[userId].marry = null;
                global.db.data.users[userId].marryName = 'Nadie';
            }
            if (global.db.data.users[partnerId]) {
                global.db.data.users[partnerId].marry = null;
                global.db.data.users[partnerId].marryName = 'Nadie';
            }
        }

        return sock.sendMessage(from, { 
            text: `💔 *${nameUser}*, te has divorciado legalmente de *${namePartner}*. ¡Felicidades por tu soltería!`,
            mentions: [userId, partnerId]
        }, { quoted: m });

    } catch (e) {
        console.error("Error en divorcio Mongo:", e);
        return sock.sendMessage(from, { text: '❌ Hubo un fallo en el registro civil de MongoDB.' }, { quoted: m });
    }
  }
};