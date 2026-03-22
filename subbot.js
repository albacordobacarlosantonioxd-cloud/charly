const { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');

async function startSubBot(m, client, phone) {
    // 1. Validar el chat de destino (JID) de forma segura
    const chatId = m.key?.remoteJid || m.chat;
    if (!chatId) return console.log("❌ No se pudo determinar el ID del chat.");

    const userJid = phone;
    const sessionFolder = `./Sessions/Subs/${userJid}`;

    // Limpieza de sesión previa para evitar códigos inválidos
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
            browser: Browsers.ubuntu('Chrome'), 
            markOnlineOnConnect: true,
        });

        // 2. Generar el código
        if (!sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    console.log(`\x1b[36m[ GENERANDO ] Código para: ${phone}\x1b[0m`);
                    let code = await sock.requestPairingCode(phone);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    
                    const texto = `✅ *CÓDIGO DE VINCULACIÓN*\n\nNúmero: *${phone}*\nCódigo: *${code}*\n\n_Pégalo en tu WhatsApp ahora mismo._`;
                    
                    // USAMOS EL CLIENT (EL BOT PRINCIPAL) PARA ENVIAR EL MENSAJE
                    await client.sendMessage(chatId, { text: texto }, { quoted: m });

                } catch (err) {
                    console.error("❌ Error al generar Pairing Code:", err);
                }
            }, 7000); // 7 segundos para asegurar estabilidad
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                console.log(`\x1b[32m[ CONECTADO ] Sub-Bot ${userJid} activo.\x1b[0m`);
                await client.sendMessage(chatId, { text: "✅ ¡Ya estás vinculado exitosamente, pariente!" });
            }
            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    startSubBot(m, client, phone);
                }
            }
        });

        // Lógica de mensajes para el subbot
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            const handler = require('./index.js');
            const mainFunc = handler.main || handler.default || handler;
            if (typeof mainFunc === 'function') await mainFunc(sock, messages[0], messages);
        });

    } catch (e) {
        console.log("Error crítico en subbot:", e);
    }
}

module.exports = { startSubBot };