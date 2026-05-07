import { proposals } from "./marry.js"; // Importamos la RAM del otro archivo
import { User } from "../../index.js";

async function run(sock, m, from) {
    const acceptor = m.sender; // El que pone .accept
    const proposer = proposals[acceptor]; // Buscamos quién le propuso a él

    if (!proposer) {
        return sock.sendMessage(from, { text: '《✧》 No tienes ninguna propuesta de matrimonio pendiente.' }, { quoted: m });
    }

    try {
        const userProposer = await User.findOne({ jid: proposer });
        const userAcceptor = await User.findOne({ jid: acceptor });

        const nameProposer = userProposer?.name || proposer.split('@')[0];
        const nameAcceptor = userAcceptor?.name || m.pushName || acceptor.split('@')[0];

        // ACTUALIZACIÓN EN MONGODB
        await User.updateOne({ jid: proposer }, { $set: { marry: acceptor, marryName: nameAcceptor } });
        await User.updateOne({ jid: acceptor }, { $set: { marry: proposer, marryName: nameProposer } });

        // Sincronizar global.db (opcional)
        if (global.db?.data?.users) {
            [proposer, acceptor].forEach(jid => {
                if (global.db.data.users[jid]) {
                    global.db.data.users[jid].marry = jid === proposer ? acceptor : proposer;
                    global.db.data.users[jid].marryName = jid === proposer ? nameAcceptor : nameProposer;
                }
            });
        }

        // Limpiar la propuesta de la RAM
        delete proposals[acceptor];

        return sock.sendMessage(from, { 
            text: `💍 ¡Felicidades! *${nameProposer}* y *${nameAcceptor}* ahora están legalmente casados. 🥂`,
            mentions: [proposer, acceptor]
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        return sock.sendMessage(from, { text: '❌ Hubo un error al procesar la boda.' }, { quoted: m });
    }
}

export default { name: 'accept', category: 'perfil', aliases: ['aceptar'], run };
