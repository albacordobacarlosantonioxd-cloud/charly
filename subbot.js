const { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');

if (!global.conns) global.conns = [];

async function startSubBot(m, client, phone) {
    try {
        // Validación ultra-segura del remitente
        const rawSender = m?.sender || m?.key?.participant || m?.key?.remoteJid || (phone ? `${phone}@s.whatsapp.net` : null);
        
        if (!rawSender) {
            console.log('\x1b[31m[ ERROR ] No se pudo determinar el ID del usuario.\x1b[0m');
            return;
        }

        const userJid = rawSender.split('@')[0];
        const sessionFolder = `./Sessions/Subs/${userJid}`;

        console.log(`\x1b[34m[ DEBUG ] Iniciando sesión para: ${userJid}\x1b[0m`);

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

        if (!sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phone);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    const texto = `✅ *TU CÓDIGO DE SUB-BOT*\n\nHola *@${userJid}*, usa este código para vincularte:\n\n1. Ve a "Dispositivos vinculados"\n2. Selecciona "Vincular con el número de teléfono"\n3. Escribe este código:\n\n*${code}*`;
                    await client.sendMessage(m.key.remoteJid, { text: texto, mentions: [rawSender] }, { quoted: m });
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
                console.log(`\x1b[32m\n[ ✅ ] SUB-BOT CONECTADO: ${sock.user.id}\x1b[0m`);
                await client.sendMessage(m.key.remoteJid, { text: `✅ ¡Felicidades! Ya eres un Sub-Bot activo.` });
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    startSubBot(m, client, phone);
                } else {
                    if (fs.existsSync(sessionFolder)) fs.rmSync(sessionFolder, { recursive: true, force: true });
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (let raw of messages) {
                try {
                    const handler = require('./index.js');
                    const mainFunc = handler.main || handler.default || handler;
                    if (typeof mainFunc === 'function') await mainFunc(sock, raw, messages);
                } catch (e) {
                    console.log(`\x1b[31m[ ERROR SUB-BOT LOGIC ]: ${e.message}\x1b[0m`);
                }
            }
        });

    } catch (error) {
        console.error("Error crítico en startSubBot:", error);
    }
}

module.exports = { startSubBot };