function getNumber(jid = '') {
    return String(jid || '').split(':')[0].split('@')[0]
}

export default {
    command: ['pfp', 'profilepic', 'pp'],
    help: ['pfp @user', 'pfp <quoted>'],
    description: 'Obtiene la foto de perfil de un usuario.',
    category: 'tools',
    // Cambiamos "execute" por "run" para que coincida con tu index.js
    async run({ sock, m }) {
        const target = m.mentions?.[0] || m.quoted?.sender || m.sender
        
        try {
            const pp = await sock.profilePictureUrl(target, 'image')
            
            return await sock.sendMessage(m.chat, {
                image: { url: pp },
                caption: `Foto de perfil de @${getNumber(target)}`,
                mentions: [target]
            }, { quoted: m })

        } catch (error) {
            return await sock.sendMessage(m.chat, {
                text: `No pude obtener la foto de perfil de @${getNumber(target)}.`,
                mentions: [target]
            }, { quoted: m })
        }
    }
}
