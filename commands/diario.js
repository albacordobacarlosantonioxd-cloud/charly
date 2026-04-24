const { formatRemainingTime } = require('../utils/formatTime');

async function handleDaily(sender, from, m, sock, db, saveDB) {
    if (!db.users[sender]) db.users[sender] = {};
    const user = db.users[sender];

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; 
    const maxStreak = 200;

    if (user.streak === undefined) user.streak = 0;
    if (user.lastDailyGlobal === undefined) user.lastDailyGlobal = 0;
    if (user.money === undefined) user.money = 0;

    if (user.lastDailyGlobal !== 0 && now < (user.lastDailyGlobal + oneDay)) {
        const tiempoRestante = (user.lastDailyGlobal + oneDay) - now;
        const restante = formatRemainingTime(tiempoRestante);
        
        return await sock.sendMessage(from, { 
            text: `⚠️ *¡Ya cobraste hoy, pariente!* \n\nVuelve en: *${restante}* para tu siguiente recompensa.` 
        }, { quoted: m });
    }

    const lost = user.streak >= 1 && (now - user.lastDailyGlobal) > (oneDay * 1.5);
    if (lost) user.streak = 0;

    user.streak = Math.min(user.streak + 1, maxStreak);
    const recompensa = Math.min(20000 + (user.streak - 1) * 5000, 1015000);
    
    user.money += recompensa; 
    user.lastDailyGlobal = now; 
    
    await saveDB(sender); 

    const siguiente = Math.min(20000 + user.streak * 5000, 1015000).toLocaleString();
    let texto = `「 🎁 *RECOMPENSA DIARIA* 🎁 」\n\n`;
    texto += `*+ $${recompensa.toLocaleString()}* agregados a tu cuenta.\n`;
    texto += `🔥 *Racha actual:* ${user.streak} día(s)\n`;
    texto += `💰 *Próximo Daily:* +$${siguiente}\n\n`;
    
    texto += lost ? `> ❗ *Perdiste tu racha anterior por no venir ayer.*` : `> ¡Sigue así para ganar más mañana!`;

    await sock.sendMessage(from, { text: texto }, { quoted: m });
}

module.exports = { handleDaily };