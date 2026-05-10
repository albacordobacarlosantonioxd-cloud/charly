export default {
    name: "tag",
    category: 'grupos',
    // Cambiamos los parámetros para que coincidan con el nuevo index.js
    run: async (sock, m, from, text, { isAdmin, isGroup }) => {
        
        // Verificamos que sea un grupo y que el que lo usa sea admin
        if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." });
        if (!isAdmin) return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden usar este comando." });
        
        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants.map(p => p.id);
            
            // Buscamos el contenido en el texto o en el mensaje citado
            const content = text || (m.quoted?.message?.conversation || m.quoted?.message?.extendedTextMessage?.text);

            if (!content) {
                return sock.sendMessage(from, { text: "《✧》 Escribe algo o responde a un mensaje para taggear a todos, pariente." });
            }

            await sock.sendMessage(from, { 
                text: content, 
                mentions: participants 
            });

        } catch (e) {
            console.error("Error en hidetag:", e);
            await sock.sendMessage(from, { text: "❌ No pude mencionar a todos." });
        }
    }
};
