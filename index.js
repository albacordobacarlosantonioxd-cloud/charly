import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import pino from "pino";
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs-extra";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import {
    default as makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} from "@whiskeysockets/baileys";

const app = express();
const PORT = process.env.PORT || 3000;

// --- MODELOS Y BASE DE DATOS ---
const mongoURI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    name: { type: String, default: "Usuario" },
    money: { type: Number, default: 100 },
    lastwork: { type: Number, default: 0 },
    lastDailyGlobal: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    usedcommands: { type: Number, default: 0 },
    birth: { type: String, default: "No definido" },
    hobby: { type: String, default: "No definido" },
    gender: { type: String, default: "No definido" },
    description: { type: String, default: "Sin descripción" },
    marry: { type: String, default: null },
    marryName: { type: String, default: "Nadie" },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    history: { type: Array, default: [] }
});
const User = mongoose.model("User", UserSchema);

const GroupSchema = new mongoose.Schema({
    id: { type: String, unique: true }, 
    onlyAdmin: { type: Boolean, default: false },
    antilink: { type: Boolean, default: false },
    nsfw: { type: Boolean, default: false },
    sfw: { type: Boolean, default: true }
});
const Group = mongoose.model("Group", GroupSchema);

const PackSchema = new mongoose.Schema({
    owner: { type: String, required: true },
    name: { type: String, required: true },
    author: { type: String, default: "Charly-Bot" }, 
    desc: { type: String, default: "Sin descripción" },
    isPublic: { type: Boolean, default: false },
    stickers: [{
        base64: { type: String },
        url: { type: String },
        fileSha256: { type: String }, 
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now }
});
const Pack = mongoose.model("Pack", PackSchema);

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Conectado"))
  .catch(err => console.error("❌ Error MongoDB:", err));

// --- CONFIGURACIÓN EXPRESS ---
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.send("✅ Bot Activo"));
app.listen(PORT, () => console.log(`🚀 API en puerto ${PORT}`));

// --- CARGADOR DE COMANDOS ---
const commands = new Map();
const loadCommands = async (dir = "./commands") => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            await loadCommands(filePath);
        } else if (file.endsWith(".js")) {
            try {
                const module = await import(pathToFileURL(path.resolve(filePath)).href);
                const command = module.default || module;
                const name = command.name || (Array.isArray(command.command) ? command.command[0] : command.command);
                if (name) {
                    commands.set(name, command);
                    if (command.aliases) {
                        command.aliases.forEach(alias => commands.set(alias, command));
                    }
                    if (Array.isArray(command.command)) {
                        command.command.forEach(cmd => commands.set(cmd, command));
                    }
                }
            } catch (e) {
                console.error(`❌ Error cargando comando en ${filePath}:`, e.message || e);
            }
        }
    }
};
// --- WHATSAPP CONNECTION ---
let sock;
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        printQRInTerminal: true,
        browser: ["Charly-Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("📱 Escanea el QR con tu WhatsApp:");
            try {
                await QRCode.toFile("qr-code.png", qr, { scale: 8 });
                console.log("✅ Imagen QR guardada como: qr-code.png (ábrela y escanéala)");
            } catch (err) {
                console.error("❌ Error al guardar el QR:", err.message);
            }
        }
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("✅ Conectado a WhatsApp");
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
        const from = m.key.remoteJid;
        const sender = m.key.fromMe ? (sock.user.id.split(":")[0] + "@s.whatsapp.net") : (m.key.participant || from);
        m.sender = sender;
        const isGroup = from.endsWith("@g.us");

        // MIDDLEWARE para antilink
        const antilinkCommand = commands.get("antilink");
        if (antilinkCommand && antilinkCommand.middleware) {
            await antilinkCommand.middleware(sock, m, from, isGroup);
        }

        const prefixes = [".", "!", "/", "#", "$"];
        const prefix = prefixes.find(p => body.startsWith(p));
        if (!prefix) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const text = args.join(" ");
        
        const cmd = commands.get(commandName);
        if (!cmd) return;

        // --- NORMALIZAR SENDER (quitar :XX del final) ---
        const normalizedSender = sender.split(':')[0] + '@s.whatsapp.net';

        // --- CHEQUEO ADMINS ---
        let isAdmin = false;
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                const participant = groupMetadata.participants.find(p => {
                    const normalizedP = p.id.split(':')[0] + '@s.whatsapp.net';
                    return normalizedP === normalizedSender;
                });
                isAdmin = participant ? (participant.admin !== null && participant.admin !== undefined) : false;
            } catch (e) {
                isAdmin = false;
            }
        }

        try {
            await cmd.run(sock, m, from, text, m.message.extendedTextMessage?.contextInfo?.quotedMessage, args, isAdmin, isGroup, normalizedSender);
        } catch (e) {
            console.error(`Error en comando ${commandName}:`, e);
        }
    });
}

// Base de datos en RAM para compatibilidad con comandos legacy
const db = { users: {}, chats: {}, settings: {} };

export { User, Group, Pack, app, commands, sock, db };

// Retrasamos la carga de comandos para evitar dependencias circulares (los comandos importan index.js)
setImmediate(async () => {
    await loadCommands();
    if (process.env.TEST_MODE !== 'true') {
        startBot();
    }
});
