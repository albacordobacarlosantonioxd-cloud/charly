function getNumber(jid = '') {
    return String(jid || '').split(':')[0].split('@')[0]
}

export default {
    command: ['pfp', 'profilepic', 'pp'],
    help: ['pfp @user', 'pfp <quoted>'],
    description: 'Obtiene la foto de perfil de un usuario.',
    category: 'tools',
    async execute({ sock, m }) {
        // Detecta si mencionaste a alguien, respondiste a un mensaje o si es para ti mismo
        const target = m.mentions?.[0] || m.quoted?.sender || m.sender
        
        try {
            // Intentamos obtener la URL de la imagen
            const pp = await sock.profilePictureUrl(target, 'image')
            
            return await sock.sendMessage(m.chat, {
                image: { url: pp },
                caption: `🏮 *Foto de perfil de:* @${getNumber(target)}`,
                mentions: [target]
            }, { quoted: m })

        } catch (error) {
            // Este error salta si el usuario no tiene foto o la tiene "solo para contactos"
            return await sock.sendMessage(m.chat, {
                text: `❌ No pude obtener la foto de perfil de @${getNumber(target)}.\n\n> *Nota:* Puede que no tenga foto o sea privada.`,
                mentions: [target]
            }, { quoted: m })
        }
    }
}
