const { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const chalk = require('chalk');

// Evitamos que explote si no hay conexiones globales
if (!global.conns) global.conns = [];

async function startSubBot(m, client, phone) {
    try {
        // --- 🛡️ EXTRACCIÓN SEGURA DEL ID (REPARADO) ---
        // Buscamos el ID en m.sender, o en el JID del chat, o usamos el phone directo
        const rawSender = m?.sender || m?.key?.remoteJid || (phone ? `${phone}@s.whatsapp.net` : null);
        
        if (!rawSender) {
            console.log(chalk.red('[ ERROR ] No se pudo determinar el ID del usuario.'));
            return;
        }

        const userJid = rawSender.split('@')[0]; // Aquí ya no dará error porque rawSender está validado
        const sessionFolder = `./Sessions/Subs/${userJid}`;

        console.log(chalk.blue(`[ DEBUG ] Iniciando sesión para: ${userJid}`));

        // Crear carpeta de sesión si no existe
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

        // --- 🔑 GENERAR CÓDIGO DE VINCULACIÓN ---
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
                if (!global.conns.find(c => c.user?.id === sock.user?.id)) {
                    global.conns.push(sock);
                }
                console.log(chalk.green(`\n[ ✅ ] SUB-BOT CONECTADO: ${sock.user.id}`));
                await client.sendMessage(m.key.remoteJid, { text: `✅ ¡Felicidades! Ya eres un Sub-Bot activo.` });
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellow(`[ ⚠️ ] Reconectando Sub-Bot: ${userJid}`));
                    startSubBot(m, client, phone);
                } else {
                    fs.rmSync(sessionFolder, { recursive: true, force: true });
                    console.log(chalk.red(`[ ❌ ] Sesión eliminada para: ${userJid}`));
                }
            }
        });

        // --- 🧠 CEREBRO COMPARTIDO (EJECUTA TUS COMANDOS) ---
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (let raw of messages) {
                try {
                    // Importamos tu lógica principal del index.js
                    // Asegúrate de que tu index.js tenga: module.exports = { main }
                    const handler = require('./index.js');
                    const mainFunc = handler.main || handler.default || handler;

                    if (typeof mainFunc === 'function') {
                        await mainFunc(sock, raw, messages);
                    }
                } catch (e) {
                    console.log(chalk.red(`[ ERROR SUB-BOT LOGIC ]: ${e.message}`));
                }
            }
        });

    } catch (error) {
        console.error("Error crítico en startSubBot:", error);
    }
}

module.exports = { startSubBot };