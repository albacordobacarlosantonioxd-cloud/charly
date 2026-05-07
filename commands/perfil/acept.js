import { proposals } from "./marry.js"; 
import { User } from "../../index.js";

const run = async (sock, m, { from }) => {
    const acceptor = m.sender; 
    const proposer = proposals[acceptor]; 

    if (!proposer) {
        return sock.sendMessage(from, { text: '《✧》 No tienes ninguna propuesta pendiente.' }, { quoted: m });
    }

    try {
        const userProposer = await User.findOne({ jid: proposer });
        const userAcceptor = await User.findOne({ jid: acceptor });

        // Obtenemos nombres reales de forma segura
        const nameProposer = userProposer?.name || (await sock.getName(proposer)) || proposer.split('@')[0];
        const nameAcceptor = userAcceptor?.name || m.pushName || (await sock.getName(acceptor)) || acceptor.split('@')[0];

        // Guardamos en MongoDB Atlas
        await User.updateOne({ jid: proposer }, { $set: { marry: acceptor, marryName: nameAcceptor } });
        await User.updateOne({ jid: acceptor }, { $set: { marry: proposer, marryName: nameProposer } });

        // Sincronizar global.db
        if (global.db?.data?.users) {
            if (global.db.data.users[proposer]) {
                global.db.data.users[proposer].marry = acceptor;
                global.db.data.users[proposer].marryName = nameAcceptor;
            }
            if (global.db.data.users[acceptor]) {
                global.db.data.users[acceptor].marry = proposer;
                global.db.data.users[acceptor].marryName = nameProposer;
            }
        }

        delete proposals[acceptor];

        return sock.sendMessage(from, { 
            text: `💍 ¡Felicidades! *${nameProposer}* y *${nameAcceptor}* ahora están legalmente casados. 🥂`,
            mentions: [proposer, acceptor]
        }, { quoted: m });

    } catch (e) {
        console.error("Error en accept.js:", e);
        return sock.sendMessage(from, { text: '❌ Error al procesar la boda en la base de datos.' }, { quoted: m });
    }
};

export default { 
    name: 'accept', 
    category: 'perfil', 
    aliases: ['aceptar'], 
    run 
};
