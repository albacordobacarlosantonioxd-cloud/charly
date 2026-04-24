module.exports = {
  name: 'work',
  aliases: ['w', 'chambear', 'chamba', 'trabajar'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
    const formatTime = require('../utils/formatTime');
    const trabajosLista = require('../data/trabajosLista');
    // 1. Aseguramos que el usuario exista en la memoria local
    if (!db.users[sender]) db.users[sender] = { id: sender, money: 0, lastwork: 0 };
    const user = db.users[sender];
    
    const cooldown = 3 * 60 * 1000; // 3 minutos de espera
    const now = Date.now();
    
    // 2. Revisar si el usuario está en tiempo de espera (Cooldown)
    if (user.lastwork && now < user.lastwork) {
        const tiempoRestanteMs = user.lastwork - now;
        const tiempoRestante = formatTime(tiempoRestanteMs); // Asegúrate de tener tu función formatTime
        
        return await sock.sendMessage(from, { 
            text: `⚠️ *¡Tranquilo, pariente!* \n\nDebes esperar *${tiempoRestante}* para volver a la chamba.` 
        }, { quoted: m });
    }

    // 3. Definir la ganancia aleatoria (entre $2000 y $4000)
    const rsl = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    
    // 4. Actualizar datos en el objeto local
    user.money = (user.money || 0) + rsl;
    user.lastwork = now + cooldown;
    
    // 5. ¡LO MÁS IMPORTANTE! Guardar en la nube de MongoDB
    try {
        await saveDB(sender); 
    } catch (e) {
        console.error("Error al guardar la chamba en Mongo:", e);
    }

    // 6. Elegir un trabajo aleatorio de la lista
    // Asegúrate de tener definida 'trabajosLista' arriba de tus cases
    const mensajeTrabajo = pickRandom(trabajosLista);

    await sock.sendMessage(from, { 
        text: `👷 *${mensajeTrabajo}*\n💰 Ganaste: *+$${rsl.toLocaleString()}* pesos.\n\n> _Tus ahorros están seguros en la nube._` 
    }, { quoted: m });
  }
};