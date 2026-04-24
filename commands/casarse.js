const User = require('../models/User');

async function handleMarry(sender, from, m, sock) {
    const proposer = sender; 
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    if (!mentioned) return await sock.sendMessage(from, { text: '《✧》 Menciona a la persona con la que te quieres casar, pariente.' }, { quoted: m });
    if (proposer === mentioned) return await sock.sendMessage(from, { text: '《✧》 No puedes casarte contigo mismo, no seas gacho.' }, { quoted: m });

    // 1. Buscamos a los dos en MongoDB
    let userProposer = await User.findOne({ jid: proposer });
    let userMentioned = await User.findOne({ jid: mentioned });

    // 2. Si no existen, los creamos (Registro automático)
    if (!userProposer) {
        userProposer = new User({ jid: proposer, name: 'Usuario', money: 100 });
        await userProposer.save();
    }
    if (!userMentioned) {
        userMentioned = new User({ jid: mentioned, name: 'Usuario', money: 100 });
        await userMentioned.save();
    }

    // 3. Revisamos si ya están casados (Usando los datos de MongoDB)
    if (userProposer.marry) return await sock.sendMessage(from, { text: `《✧》 Ya estás casado, no seas infiel.` }, { quoted: m });
    if (userMentioned.marry) return await sock.sendMessage(from, { text: `《✧》 Esa persona ya tiene dueño(a).` }, { quoted: m });

    // 4. Guardamos la propuesta (Esto sí puede ser global porque es temporal)
    global.proposals[mentioned] = proposer;
    global.proposalTimes[mentioned] = Date.now();

    await sock.sendMessage(from, { 
        text: `💍 *PROPUESTA DE MATRIMONIO*\n\n@${proposer.split('@')[0]} le ha pedido matrimonio a @${mentioned.split('@')[0]}.\n\n⚘ *Responde con:*\n> ❀ *.acept* para confirmar.\n> ❀ Tienes 2 minutos antes de que expire.`,
        mentions: [proposer, mentioned]
    }, { quoted: m });

    setTimeout(() => { 
        if (global.proposals[mentioned] === proposer) {
            delete global.proposals[mentioned]; 
            delete global.proposalTimes[mentioned];
        }
    }, 120000);
}

module.exports = { handleMarry };