const User = require('../models/User');

async function handleAcept(sender, from, m, sock) {
    const mentioned = sender; // El que acepta es el "mentioned" del paso anterior
    const proposer = global.proposals[mentioned];

    if (!proposer) return await sock.sendMessage(from, { text: '《✧》 No tienes ninguna propuesta pendiente, pariente.' }, { quoted: m });

    try {
        // 1. Buscamos a ambos en la DB
        let userProposer = await User.findOne({ jid: proposer });
        let userMentioned = await User.findOne({ jid: mentioned });

        // 2. Casamos a los dos (Guardamos JID y Nombre)
        await User.updateOne({ jid: proposer }, { 
            $set: { marry: mentioned, marryName: userMentioned?.name || 'Alguien especial' } 
        });
        await User.updateOne({ jid: mentioned }, { 
            $set: { marry: proposer, marryName: userProposer?.name || 'Alguien especial' } 
        });

        // 3. Limpiamos la propuesta temporal
        delete global.proposals[mentioned];

        // 4. Mensaje de celebración
        await sock.sendMessage(from, { 
            text: `🎊 ¡VIVAN LOS NOVIOS! 🎊\n\n@${proposer.split('@')[0]} y @${mentioned.split('@')[0]} se han casado oficialmente.\n\n> Ya pueden ver su estado civil en su .perfil`,
            mentions: [proposer, mentioned]
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: '❌ Hubo un error al registrar el matrimonio.' }, { quoted: m });
    }
}

module.exports = { handleAcept };