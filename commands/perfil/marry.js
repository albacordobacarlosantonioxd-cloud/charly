import { resolveLidToRealJid } from "../core/utils.js";
import { User } from "../../index.js";

// Exportamos la RAM para que el comando accept pueda leerla
export let proposals = {};

async function run(sock, m, from, text, quoted, args, isAdmin, isGroup) {
    const proposer = m.sender;
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (quoted ? quoted.sender : null);
    
    if (!mentioned) return sock.sendMessage(from, { text: '《✧》 Menciona al usuario al que deseas proponer matrimonio.' }, { quoted: m });

    const proposee = await resolveLidToRealJid(mentioned, sock, from);

    if (proposer === proposee) return sock.sendMessage(from, { text: '《✧》 No puedes proponerte matrimonio a ti mismo.' }, { quoted: m });

    try {
        const userProposer = await User.findOne({ jid: proposer });
        const userProposee = await User.findOne({ jid: proposee });

        const nameProposer = userProposer?.name || m.pushName || proposer.split('@')[0];
        const nameProposee = userProposee?.name || proposee.split('@')[0];

        if (userProposer?.marry) return sock.sendMessage(from, { text: `《✧》 Ya estás casado con *${userProposer.marryName}*.` }, { quoted: m });
        if (userProposee?.marry) return sock.sendMessage(from, { text: `《✧》 *${nameProposee}* ya está casado con otra persona.` }, { quoted: m });

        // Guardamos la propuesta: La clave es el "mencionado" y el valor es el "proponente"
        proposals[proposee] = proposer;

        setTimeout(() => {
            if (proposals[proposee] === proposer) delete proposals[proposee];
        }, 120000);

        const msg = `💍 *PROPUESTA DE MATRIMONIO*\n\n` +
                    `@${proposer.split('@')[0]} le ha pedido matrimonio a @${proposee.split('@')[0]}.\n\n` +
                    `⚘ *Para aceptar, @${proposee.split('@')[0]} debe responder con:* \n` +
                    `> *.accept*\n\n` +
                    `⌛ _Expira en 2 minutos._`;

        return sock.sendMessage(from, { text: msg, mentions: [proposer, proposee] }, { quoted: m });

    } catch (e) {
        console.error(e);
        return sock.sendMessage(from, { text: '❌ Error al conectar con la base de datos.' }, { quoted: m });
    }
}

export default { name: 'marry', category: 'perfil', aliases: ['proponer'], run };
