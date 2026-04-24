const User = require('../models/User');

async function handleDivorce(sender, from, m, sock) {
    // 1. Buscamos al usuario que pide el divorcio en Mongo
    let user = await User.findOne({ jid: sender });
    const parejaId = user?.marry;

    if (!parejaId || parejaId === "") {
        return await sock.sendMessage(from, { text: '《✧》 No tienes de quién divorciarte, pariente. Estás más solo que la una.' }, { quoted: m });
    }

    try {
        // 2. ACTUALIZACIÓN EN MONGO: Limpiamos a los dos de un solo golpe
        await User.updateOne({ jid: sender }, { $set: { marry: null, marryName: 'Nadie' } });
        await User.updateOne({ jid: parejaId }, { $set: { marry: null, marryName: 'Nadie' } });

        // 3. Sincronizamos la RAM (Opcional, para que el cambio sea instantáneo)
        if (db.users[sender]) {
            db.users[sender].marry = null;
            db.users[sender].marryName = 'Nadie';
        }
        if (db.users[parejaId]) {
            db.users[parejaId].marry = null;
            db.users[parejaId].marryName = 'Nadie';
        }

        await sock.sendMessage(from, { 
            text: `💔 *DIVORCIO LEGALIZADO*\n\nTe has divorciado de @${parejaId.split('@')[0]}. Ya puedes buscar un nuevo amor.`,
            mentions: [parejaId]
        }, { quoted: m });

    } catch (e) {
        console.error("Error en divorcio:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un error en el registro civil de MongoDB.' }, { quoted: m });
    }
}

module.exports = { handleDivorce };