import { Browsers, makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';

// --- IMPORTANTE: Ajusta esto al nombre de tu archivo principal ---
import main from './index.js'; 

if (!global.conns) global.conns = [];

export async function startSubBot(m, client, phone) {
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
        browser: Browsers.macOS('Chrome'), // Necesario para el pairing code
        auth: state,
        version,
        markOnlineOnConnect: true,
    });

    // --- GENERAR CÓDIGO DE 8 DÍGITOS ---
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phone);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                
                const texto = `✅ *CÓDIGO DE VINCULACIÓN*\n\nHola *@${userJid}*, usa este código para activar tu Sub-Bot:\n\n1. Ve a "Dispositivos vinculados"\n2. Dale a "Vincular con el número de teléfono"\n3. Escribe este código:\n\n*${code}*`;
                
                await client.sendMessage(m.chat, { text: texto, mentions: [m.sender] }, { quoted: m });
            } catch (err) {
                console.error("Error al generar Pairing Code:", err);
                await client.sendMessage(m.chat, { text: "❌ No pude generar el código. Inténtalo de nuevo en un momento." });
            }
        }, 3000); 
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            sock.isInit = true;
            if (!global.conns.find(c => c.user.id === sock.user.id)) global.conns.push(sock);
            console.log(chalk.green(`\n[ SUB-BOT ] Conectado: ${sock.user.id}`));
            await client.sendMessage(m.chat, { text: `✅ ¡Sub-Bot conectado con éxito!` }, { quoted: m });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                // Reconectar automáticamente si se cae la red
                startSubBot(m, client, phone);
            } else {
                // Si el usuario cerró sesión, borramos la carpeta
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                console.log(chalk.red(`[ SUB-BOT ] Sesión de ${userJid} eliminada.`));
            }
        }
    });

    // --- PROCESAR MENSAJES USANDO TU INDEX.JS ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (let raw of messages) {
            try {
                // Como no tienes message.js, le pasamos el mensaje tal cual
                // Tu index.js debe ser capaz de procesarlo
                await main(sock, raw, messages); 
            } catch (e) {
                console.log(chalk.red(`[ ERROR SUB-BOT ]: ${e.message}`));
            }
        }
    });

    return sock;
}