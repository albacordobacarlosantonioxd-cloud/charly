import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'setgpbanner',
    aliases: ['setppgc', 'setgroupimg'],
    category: 'grupo',
    isAdmin: true,
    botAdmin: true,
    run: async (client, m, from) => {
        // 1. Buscamos la imagen en el mensaje directo o en el citado (quoted)
        const directImage = m.message?.imageMessage;
        
        // Forma correcta de buscar el quoted en la estructura de Baileys
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedImage = quotedMessage?.imageMessage;

        const imageMessage = directImage || quotedImage;

        // LOGS para debuggear en tu terminal
        console.log("[DEBUG] ¿Mensaje directo tiene imagen?:", !!directImage);
        console.log("[DEBUG] ¿Mensaje citado tiene imagen?:", !!quotedImage);

        if (!imageMessage) {
            return client.sendMessage(from, { 
                text: '《✧》 Te faltó la imagen o responde a una para cambiar el perfil del grupo.' 
            }, { quoted: m });
        }

        try {
            await client.sendMessage(from, { react: { text: '⏳', key: m.key } });

            // 2. Descargar la imagen
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (!buffer || buffer.length === 0) {
                throw new Error("Buffer vacío tras descarga");
            }

            // 3. Actualizar la foto del grupo
            // Usamos 'from' porque es el JID del grupo actual
            await client.updateProfilePicture(from, buffer);
            
            await client.sendMessage(from, { react: { text: '✅', key: m.key } });
            await client.sendMessage(from, { 
                text: '✿ La imagen del grupo se actualizó con éxito, pariente.' 
            }, { quoted: m });

        } catch (e) {
            console.error("======== ERROR SETGPBANNER ========");
            console.error(e);
            console.error("====================================");
            
            await client.sendMessage(from, { react: { text: '❌', key: m.key } });
            return client.sendMessage(from, { 
                text: `> Ocurrió un error al intentar cambiar la imagen.\n> [Error: *${e.message}*]` 
            }, { quoted: m });
        }
    },
};
