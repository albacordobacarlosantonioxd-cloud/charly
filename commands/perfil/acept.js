import { proposals } from "./marry.js"; // Importamos la RAM del otro archivo
import { User } from "../../index.js";

aasync function run(sock, m, from) {
    const acceptor = m.sender; 
    const proposer = proposals[acceptor]; 

    if (!proposer) {
        return sock.sendMessage(from, { text: '《✧》 No tienes ninguna propuesta pendiente.' }, { quoted: m });
    }

    try {
        // Buscamos los datos en la DB
        const userProposer = await User.findOne({ jid: proposer });
        const userAcceptor = await User.findOne({ jid: acceptor });

        // LÓGICA DE NOMBRES MEJORADA:
        // 1. Prioridad: Nombre en DB. 2. PushName de WhatsApp. 3. Número de teléfono.
        const nameProposer = userProposer?.name || (await sock.getName(proposer)) || proposer.split('@')[0];
        const nameAcceptor = userAcceptor?.name || m.pushName || (await sock.getName(acceptor)) || acceptor.split('@')[0];

        // ACTUALIZACIÓN EN MONGODB ATLAS (Aquí está el truco: guardamos el nombre del OTRO)
        await User.updateOne({ jid: proposer }, { $set: { marry: acceptor, marryName: nameAcceptor } });
        await User.updateOne({ jid: acceptor }, { $set: { marry: proposer, marryName: nameProposer } });

        // Sincronizar global.db (si lo usas para el comando .perfil)
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
            text: `💍 ¡Felicidades! *${nameProposer}* y *${nameAcceptor}* ahora están legalmente casados. 🥂\n\n_Ahora ambos pueden revisar su .perfil_`,
            mentions: [proposer, acceptor]
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        return sock.sendMessage(from, { text: '❌ Error en la base de datos.' }, { quoted: m });
    }
}

export default { name: 'acept', category: 'perfil', aliases: ['aceptar'], run };
