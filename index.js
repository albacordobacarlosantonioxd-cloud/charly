require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const mongoose = require("mongoose");
const pino = require("pino");
const path = require("path");
const fs = require("fs-extra");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");

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
const loadCommands = (dir = "./commands") => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith(".js")) {
            try {
                delete require.cache[require.resolve(path.resolve(filePath))];
                const command = require(path.resolve(filePath));
                if (command.name) {
                    commands.set(command.name, command);
                    if (command.aliases) {
                        command.aliases.forEach(alias => commands.set(alias, command));
                    }
                }
            } catch (e) {
                console.error(`Error cargando comando en ${filePath}:`, e);
            }
        }
    }
};
loadCommands();

// --- WHATSAPP CONNECTION ---
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

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
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
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

        // --- CHEQUEO ADMINS ---
        let isAdmin = false;
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin !== null;
            } catch (e) {
                isAdmin = false;
            }
        }

        try {
            await cmd.run(sock, m, from, text, m.message.extendedTextMessage?.contextInfo?.quotedMessage, args, isAdmin, isGroup);
        } catch (e) {
            console.error(`Error en comando ${commandName}:`, e);
        }
    });
}

startBot();