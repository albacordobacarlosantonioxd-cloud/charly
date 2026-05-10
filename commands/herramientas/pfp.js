function getNumber(jid = '') {
    return String(jid || '').split(':')[0].split('@')[0]
}

export default {
    command: ['pfp', 'profilepic', 'pp'],
    help: ['pfp @user', 'pfp <quoted>'],
    description: 'Obtiene la foto de perfil de un usuario.',
    category: 'tools',
    async run({ sock, m }) {
        // Usamos una validación simple para que no explote si no hay menciones
        const mentions = m?.mentions || []
        const quoted = m?.quoted?.sender
        const target = mentions[0] || quoted || m?.sender

        if (!target) return; // Si por algo no hay target, no hacemos nada

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
