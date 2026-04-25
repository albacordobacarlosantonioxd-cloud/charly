import mongoose from 'mongoose';

export default {
    name: 'profile',
    category: 'herramientas',
    aliases: ['perfil'],
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        const User = mongoose.model('User');
        const sender = m.key.fromMe ? (sock.user.id.split(':')[0] + '@s.whatsapp.net') : (m.key.participant || from);

        try {
            let user = await User.findOne({ jid: sender });
            if (!user) {
                user = new User({ jid: sender, name: m.pushName || 'Usuario' });
                await user.save();
            }

            const name = user.name || m.pushName || 'Usuario';
            const desc = user.description && user.description !== 'Sin descripción' ? `\n\n_${user.description}_` : '';
            const birth = user.birth || 'No definido';
            const pasatiempo = user.hobby || 'No definido'; 
            const genero = user.gender || 'No definido';
            const dinero = user.money || 0;
            const comandos = user.usedcommands || 0;
            
            const exp = user.exp || 0;
            const nivel = user.level || 1;
            
            // Re-implementación local de calcularProgreso
            const xpBase = 500;
            const xpNeeded = nivel * xpBase;
            const porcentaje = Math.min(Math.floor((exp / xpNeeded) * 100), 100);
            const bloquesLlenos = Math.floor(porcentaje / 10);
            const bloquesVacios = 10 - bloquesLlenos;
            const progresoBarra = '▰'.repeat(bloquesLlenos) + '▱'.repeat(bloquesVacios);

            const parejaId = user.marry;
            const parejaNombre = user.marryName || 'Alguien especial';
            const estadoCivil = parejaId ? 'Casado con' : 'Estado Civil';

            const profileText = `「✿」 *PERFIL DE USUARIO* 「✿」\n    \n◢ *${name}* ◤${desc}\n\n♛ *Cumpleaños:* ${birth}\n⸙ *Pasatiempo:* ${pasatiempo}\n⚥ *Género:* ${genero}\n♡ *${estadoCivil}:* ${parejaId ? parejaNombre : 'Nadie'}\n\n📊 *ESTADÍSTICAS*\n✿ *Nivel:* ${nivel}\n❀ *Experiencia:* ${exp.toLocaleString()}\n➨ *Progreso:* ${progresoBarra} ➔ ${xpNeeded} _(${porcentaje}%)_\n\n💰 *Cartera:* $${dinero.toLocaleString()}\n❒ *Comandos:* ${comandos.toLocaleString()}`;

            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(sender, 'image');
            } catch {
                ppUrl = 'https://telegra.ph/file/24fa902336e970f3f6f03.jpg';
            }

            await sock.sendMessage(from, { 
                image: { url: ppUrl }, 
                caption: profileText,
                mentions: [sender] 
            }, { quoted: m });

        } catch (e) {
            console.error("ERROR EN PERFIL:", e);
            await sock.sendMessage(from, { text: '❌ No pude cargar tu perfil, pariente.' }, { quoted: m });
        }
    }
};