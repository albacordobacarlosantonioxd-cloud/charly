import { resolveLidToRealJid } from "../core/utils.js";
import { User } from "../../index.js"; // O la ruta donde tengas tu modelo de Mongoose

// RAM temporal para las propuestas activas
let proposals = {};

async function run(sock, m, from, text, quoted, args, isAdmin, isGroup) {
    const proposer = m.sender;
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (quoted ? quoted.sender : null);
    
    if (!mentioned) return sock.sendMessage(from, { text: '《✧》 Menciona al usuario al que deseas proponer matrimonio.' }, { quoted: m });

    // Resolver ID real (LID a JID)
    const proposee = await resolveLidToRealJid(mentioned, sock, from);

    if (proposer === proposee) return sock.sendMessage(from, { text: '《✧》 No puedes proponerte matrimonio a ti mismo.' }, { quoted: m });

    try {
        // 1. Buscamos a ambos en MongoDB Atlas
        const userProposer = await User.findOne({ jid: proposer });
        const userProposee = await User.findOne({ jid: proposee });

        // Nombres para los mensajes
        const nameProposer = userProposer?.name || m.pushName || proposer.split('@')[0];
        const nameProposee = userProposee?.name || proposee.split('@')[0];

        // 2. Verificaciones de estado civil en Mongo
        if (userProposer?.marry) {
            return sock.sendMessage(from, { text: `《✧》 Ya estás casado con *${userProposer.marryName || 'alguien'}*.` }, { quoted: m });
        }
        if (userProposee?.marry) {
            return sock.sendMessage(from, { text: `《✧》 *${nameProposee}* ya está casado con *${userProposee.marryName || 'alguien'}*.` }, { quoted: m });
        }

        // 3. Lógica de Propuesta (El "Check" mutuo)
        if (proposals[proposee] === proposer) {
            // ¡ACEPTADO!
            delete proposals[proposee];

            // ACTUALIZACIÓN EN MONGO ATLAS
            await User.updateOne({ jid: proposer }, { $set: { marry: proposee, marryName: nameProposee } });
            await User.updateOne({ jid: proposee }, { $set: { marry: proposer, marryName: nameProposer } });

            // Sincronizar global.db si lo usas
            if (global.db?.data?.users) {
                if (global.db.data.users[proposer]) {
                    global.db.data.users[proposer].marry = proposee;
                    global.db.data.users[proposer].marryName = nameProposee;
                }
                if (global.db.data.users[proposee]) {
                    global.db.data.users[proposee].marry = proposer;
                    global.db.data.users[proposee].marryName = nameProposer;
                }
            }

            return sock.sendMessage(from, { 
                text: `💍 ¡Felicidades! *${nameProposer}* y *${nameProposee}* ahora están legalmente casados. 🥂`,
                mentions: [proposer, proposee]
            }, { quoted: m });

        } else {
            // SE CREA LA PROPUESTA
            proposals[proposer] = proposee;

            // Timer de 2 minutos
            setTimeout(() => {
                if (proposals[proposer] === proposee) {
                    delete proposals[proposer];
                }
            }, 120000);

            const msg = `💍 *PROPUESTA DE MATRIMONIO*\n\n` +
                        `@${proposer.split('@')[0]} le ha enviado una propuesta a ${nameProposee}.\n\n` +
                        `⚘ *Para confirmar, ${nameProposee} debe responder:* \n` +
                        `> .marry @${proposer.split('@')[0]}\n\n` +
                        `⌛ _La propuesta expira en 2 minutos._`;

            return sock.sendMessage(from, { text: msg, mentions: [proposer, proposee] }, { quoted: m });
        }

    } catch (e) {
        console.error("Error en sistema de bodas:", e);
        return sock.sendMessage(from, { text: '❌ Hubo un error al conectar con MongoDB Atlas.' }, { quoted: m });
    }
}

export default {
  name: 'marry',
    category: 'perfil',
  aliases: ['casarse', 'proponer'],
  run
};