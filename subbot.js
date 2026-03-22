const { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');

async function startSubBot(m, client, phone) {
    // 1. Limpiamos el número y definimos la carpeta
    const userJid = m.sender ? m.sender.split('@')[0] : phone;
    const sessionFolder = `./Sessions/Subs/${userJid}`;

    // 🚩 TRUCO 1: Borrar TODO rastro antes de pedir código nuevo
    if (fs.existsSync(sessionFolder)) {
        fs.rmSync(sessionFolder, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionFolder, { recursive: true });

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            auth: state,
            version,
            logger: pino({ level: 'silent' }),
            // 🚩 TRUCO 2: Usar un navegador que WhatsApp acepte mejor (Ubuntu/Chrome)
            browser: Browsers.ubuntu('Chrome'), 
            markOnlineOnConnect: true,
        });

        // 2. Pedir el código después de un breve respiro para que la conexión se asiente
        if (!sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    console.log(`\x1b[36m[ GENERANDO ] Código real para: ${phone}\x1b[0m`);
                    let code = await sock.requestPairingCode(phone);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    
                    const msg = `✅ *CÓDIGO DE VINCULACIÓN*\n\nNúmero: *${phone}*\nCódigo: *${code}*\n\n⚠️ *Instrucciones:* \n1. Ve a "Dispositivos vinculados".\n2. "Vincular con número de teléfono".\n3. Pon el código *RÁPIDO* (expira pronto).`;
                    
                    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
                } catch (err) {
                    console.error("Error al generar Pairing Code:", err);
                }
            }, 6000); // 6 segundos de espera antes de pedir el code
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log(`\x1b[32m[ CONECTADO ] Sub-Bot ${userJid} listo!\x1b[0m`);
                await client.sendMessage(m.chat, { text: "✅ ¡Ya estás vinculado con éxito!" });
            }
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    startSubBot(m, client, phone);
                }
            }
        });

    } catch (e) {
        console.log("Error en subbot:", e);
    }
}

module.exports = { startSubBot };