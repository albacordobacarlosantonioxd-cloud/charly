// 1. Importaciones necesarias (ES Modules requiere extensión .js)
import formatTime from '../../utils/formatTime.js';
import trabajosLista from '../../data/trabajosLista.js';
import { pickRandom } from '../utils/myFunctions.js';

// Importamos db desde el index principal
import { db } from '../../index.js'; 

export default {
  name: 'work',
  aliases: ['w', 'chambear', 'chamba', 'trabajar'],
  category: 'rpg',
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    
    // 2. Usar m.sender para que el dinero se guarde al usuario
    const senderId = m.sender; 

    // Aseguramos que el usuario exista en la RAM (global.db)
    if (!db.users[senderId]) {
        db.users[senderId] = { 
            jid: senderId, 
            money: 0, 
            lastwork: 0, 
            name: m.pushName || 'Usuario' 
        };
    }
    
    const user = db.users[senderId];
    const cooldown = 3 * 60 * 1000; // 3 minutos de espera
    const now = Date.now();
    
    // 3. Revisar Cooldown
    if (user.lastwork && now < user.lastwork) {
        const tiempoRestanteMs = user.lastwork - now;
        const tiempoRestante = formatTime(tiempoRestanteMs);
        
        return await sock.sendMessage(from, { 
            text: `⚠️ *¡Tranquilo, pariente!* \n\nYa chambeaste mucho. Debes esperar *${tiempoRestante}* para volver a la labor.` 
        }, { quoted: m });
    }

    // 4. Calcular ganancia (entre $2000 y $4000)
    const ganancia = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    
    // 5. Actualizar la RAM
    user.money = (user.money || 0) + ganancia;
    user.lastwork = now + cooldown;
    
    // 6. Guardar en MongoDB directamente
    try {
        const { User } = await import('../../index.js');
        await User.updateOne(
            { jid: senderId },
            { $inc: { money: ganancia }, $set: { lastwork: user.lastwork } },
            { upsert: true }
        );
    } catch (e) {
        console.error("Error al guardar en MongoDB:", e);
    }

    // 7. Elegir trabajo y enviar mensaje
    const mensajeTrabajo = pickRandom(trabajosLista);

    await sock.sendMessage(from, { 
        text: `👷 *${mensajeTrabajo}*\n\n💰 Ganaste: *+$${ganancia.toLocaleString()}* pesos.\n\n> _Tu dinero ha sido enviado a tu cuenta._` 
    }, { quoted: m });
  }
};
