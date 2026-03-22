const { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const chalk = require('chalk');

// Nota: El 'main' lo cargamos después para evitar errores de referencia circular
if (!global.conns) global.conns = [];

async function startSubBot(m, client, phone) {
    const userJid = m.sender.split('@')[0];
    const sessionFolder = `./Sessions/Subs/${userJid}`;

    // Crear carpeta si no existe
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.macOS('Chrome'), 
        auth: state,
        version,
        markOnlineOnConnect: true,
    });

    // --- GENERAR CÓDIGO AUTOMÁTICO ---
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phone);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                
                const texto = `✅ *CÓDIGO DE SUB-BOT*\n\nUsa este código para vincularte:\n\n1. Ve a "Dispositivos vinculados"\n2. Selecciona "Vincular con el número de teléfono"\n3. Escribe este código:\n\n*${code}*`;
                
                await client.sendMessage(m.chat, { text: texto, mentions: [m.sender] }, { quoted: m });
            } catch (err) {
                console.error("Error al generar Pairing Code:", err);
            }
        }, 3000); 
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            sock.isInit = true;
            if (!global.conns.find(c => c.user?.id === sock.user?.id)) global.conns.push(sock);
            console.log(chalk.green(`\n[ SUB-BOT ] Conectado: ${sock.user.id}`));
            await client.sendMessage(m.chat, { text: `✅ ¡Sub-Bot conectado con éxito!` }, { quoted: m });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startSubBot(m, client, phone);
            } else {
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                console.log(chalk.red(`[ SUB-BOT ] Sesión de ${userJid} eliminada.`));
            }
        }
    });

    // --- PROCESAR MENSAJES ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (let raw of messages) {
            try {
                // Aquí cargamos tu lógica principal
                // Si tu archivo principal se llama index.js, cámbialo aquí:
                const main = require('./index.js'); 
                
                // Si exportaste tu función como 'main', se usa así:
                if (typeof main === 'function') {
                    await main(sock, raw, messages);
                } else if (main.main) {
                    await main.main(sock, raw, messages);
                }
            } catch (e) {
                console.log(chalk.red(`[ ERROR SUB-BOT ]: ${e.message}`));
            }
        }
    });

    return sock;
}

// Exportamos la función al estilo antiguo (CommonJS)
module.exports = { startSubBot };