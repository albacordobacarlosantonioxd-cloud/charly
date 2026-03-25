const express = require('express');
const app = express();
const cors = require('cors'); 
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN NECESARIA ---
app.use(cors());
app.use(express.json()); // <--- ¡ESTA LÍNEA ES VITAL PARA EL ANUNCIO!

// 1. Ruta de vida (para UptimeRobot)
app.get('/', (req, res) => {
    res.send('✅ El Bot de Spotify está Activo y Firme, pariente.');
});

// 2. Ruta para ver la tabla de usuarios
app.get('/api/stats', async (req, res) => {
    try {
        const usuarios = await User.find().sort({ usedcommands: -1 }).limit(10);
        res.json(usuarios);
    } catch (e) {
        res.status(500).json({ error: "Error al leer la base de datos" });
    }
});

// 3. LA NUEVA LÓGICA DE ENVÍO (BROADCAST) Y REINICIO
app.post('/api/comando', async (req, res) => {
    const { accion, mensaje } = req.body;
    
    if (accion === 'reiniciar') {
        res.json({ mensaje: "Reiniciando sistema en Render..." });
        setTimeout(() => { process.exit(0); }, 2000);
    } 
    
    else if (accion === 'broadcast') {
        try {
            const usuarios = await User.find({}, 'jid');
            let enviados = 0;

            for (const user of usuarios) {
                try {
                    // RECUERDA: Cambia 'sock' por el nombre de tu variable de Baileys
                    await sock.sendMessage(user.jid, { text: mensaje });
                    enviados++;
                    await new Promise(res => setTimeout(res, 1000)); // Pausa anti-ban
                } catch (err) { console.log("Error en envío individual"); }
            }
            res.json({ mensaje: `✅ Anuncio enviado a ${enviados} usuarios.` });
        } catch (e) {
            res.status(500).json({ error: "Error en el servidor" });
        }
    }
});

// 4. Encendido
app.listen(PORT, () => {
    console.log(`🚀 Servidor Keep-Alive y API corriendo en el puerto ${PORT}`);
});

let sock; // La declaramos aquí arriba para que todo el archivo la vea
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra'); // Usamos fs-extra que ya tienes importado
const axios = require('axios');
const yts = require('yt-search');
const YTDlpWrap = require('yt-dlp-wrap').default; 
const ytDlpWrap = new YTDlpWrap('/usr/local/bin/yt-dlp');
const fetch = require('node-fetch');
const { getTracks } = require('spotify-url-info')(fetch);
const qrcode = require('qrcode-terminal');
const PDFDocument = require('pdfkit');



// --- CHEQUEO DE HERRAMIENTAS ---
const { exec } = require('child_process');

// --- CONFIGURACIÓN PARA RAILWAY (LINUX) ---
const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const MISTRAL_API_KEY = "asWpVr2HF48yiroZFviOGKVV0gAh0JCQ";
const SYLPHY_KEY = "sylphy-ty5xtWm";
const STELLAR_KEY = "api-qG4nw";
const DB_PATH = './database.json';

const mongoose = require('mongoose');
const mongoURI = 'mongodb+srv://adminbot:adminbot@cluster0.q2q0czd.mongodb.net/BotDatabase?retryWrites=true&w=majority';

// 1. UN SOLO SCHEMA PARA TODO (Dinero, Comandos e Historial)
const userSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true }, // Usamos jid para ser consistentes
    name: { type: String, default: 'Usuario' },
    usedcommands: { type: Number, default: 0 },
    money: { type: Number, default: 100 },
    history: { type: Array, default: [] } // <-- Aquí guardaremos los chats de la IA
});

// Evitamos el error de re-declaración
const User = mongoose.models.User || mongoose.model('User', userSchema);

// 2. Objeto global
global.db = {
    users: {},
    groups: {}, 
    chats: {},
    settings: {}
};
global.proposals = {};

// 3. Conexión a la base de datos
mongoose.connect(mongoURI)
  .then(() => console.log("✅ ¡MongoDB Conectado! Los datos ahora son eternos."))
  .catch(err => console.error("❌ Error al conectar a MongoDB:", err));

// 4. Función saveDB corregida
async function saveDB(sender) {
    try {
        await User.findOneAndUpdate(
            { jid: sender }, 
            { 
                $inc: { usedcommands: 1 },
                $setOnInsert: { money: 100, history: [] } 
            }, 
            { 
                upsert: true, 
                returnDocument: 'after',
                setDefaultsOnInsert: true 
            }
        );
    } catch (e) {
        if (e.code === 11000) {
            console.log("⚠️ Limpiando índices antiguos...");
            User.collection.dropIndex('id_1').catch(() => {});
        } else {
            console.error("❌ Error en MongoDB:", e);
        }
    }
}

// ✅ FUNCIÓN GLOBAL EXPANDURL
async function expandUrl(url) {
    try {
        const response = await axios.get(url, { maxRedirects: 5 });
        return response.request.res.responseUrl; 
    } catch (error) {
        return url; 
    }
}

// --- 2. FUNCIÓN PRINCIPAL ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

sock = makeWASocket({  // <--- SIN EL 'CONST' AL PRINCIPIO
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Bot Maestro", "Chrome", "1.0.0"]
});

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📸 ¡ESCANEA ESTE QR CON TU WHATSAPP!');
            qrcode.generate(qr, { small: true }); 
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;

            if (statusCode === DisconnectReason.connectionReplaced) {
                console.log("🚫 CONFLICTO: Sesión duplicada. Cerrando proceso viejo...");
                process.exit(); 
            }

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexión cerrada, reintentando:', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ ¡CONECTADO EXITOSAMENTE, PARIENTE!');
        }
    });


    // --- MANEJO DE MENSAJES ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // 🚩 EL FILTRO: Esto evita que mande doble mensaje
        if (type !== 'notify') return; 

        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        // Aquí ya sigue todo tu código de comandos...
        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
        // ... (el resto de tu lógica de comandos)
    });

    // ... (Aquí sigue el resto de tu lógica de mensajes)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
        const sender = m.key.participant || from;
        const isGroup = from.endsWith('@g.us'); 
        
// 1. Definimos la lista de prefijos permitidos
const prefixes = ['.', '!', '/', '#', '$']; 

// 2. Buscamos cuál de esos prefijos usó el usuario
const prefix = prefixes.find(p => body.startsWith(p));

// 3. Si no usó ninguno de la lista, ignoramos el mensaje
if (!prefix) return;

// 4. Separamos el comando del prefijo para que el 'case' funcione igual
const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase();
const args = body.trim().split(/ +/).slice(1);
const text = args.join(" ");
const pushname = m.pushName || 'Usuario'; // Esto extrae el nombre de quien escribe

// Línea 179 aprox:
if (!global.db.users[sender]) {
    global.db.users[sender] = { 
        money: 100, 
        usedcommands: 0 
    };
}
        // Admin Check
        let isAdmin = false;
        if (isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin !== null;
        }
        
        // Lógica para detectar links (Fuera del switch de comandos)
        if (isGroup && db.groups[from]?.antilink && !isAdmin) {
            if (body.includes('chat.whatsapp.com/') || body.includes('http')) {
                await sock.sendMessage(from, { delete: m.key }); // Borra el mensaje
                await sock.sendMessage(from, { text: '🚫 Links prohibidos aquí, compa.' });
            }
        }




        //////////

// 1. Lista maestra de lo que acepta la API (Sin repetir los que ya tenías como comandos sueltos)
const nsfwActions = ["spank", "undress", "yuri", "sixnine", "cummouth", "suckboobs", "cumshot", "lickpussy", "lickdick", "lickass", "handjob", "grope", "fingering", "creampie", "facesitting", "futanari", "pegging", "bondage", "deepthroat", "thighjob", "yaoi", "bukkake", "orgy", "grabboobs", "blowjob", "boobjob", "fap", "footjob", "squirting", "anal", "cum", "fuck"];

// 2. Alias en español para que sea más fácil de usar
const nsfwAlias = {
    // Los que ya tenías
    '69': 'sixnine', 
    'paja': 'fap', 
    'mamada': 'blowjob', 
    'bj': 'blowjob', 
    'rusa': 'boobjob',
    'tijeras': 'yuri', 
    'nalgada': 'spank', 
    'encuerar': 'undress', 
    'squirt': 'squirting',
    'leche': 'cumshot',
    'mamar': 'suckboobs',
    'lamer': 'lickpussy',
    'dedos': 'fingering',
    'garganta': 'deepthroat',
    'amarrar': 'bondage',
    'orgia': 'orgy',
    'manosear': 'grope',
    'pajas': 'handjob'
};

// 3. Detectamos si el mensaje es uno de estos comandos
const apiAction = nsfwAlias[command] || (nsfwActions.includes(command) ? command : null);

if (apiAction) {
    // Filtro SFW para que no te quemen el bot en grupos familiares
    if (isGroup && db.groups[from]?.sfw) {
        return sock.sendMessage(from, { text: '🚫 *Modo SFW activo:* Pórtense bien, parientes.' }, { quoted: m });
    }

    try {
        const apiKey = 'api-qG4nw'; // Tu llave de Stellar
        const emisor = m.pushName || 'Usuario';
        
        // Buscamos a quién etiquetaron o a quién le respondieron
        let personaEtiquetada = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                                m.message?.extendedTextMessage?.contextInfo?.participant || null;
        let textoMencion = personaEtiquetada ? `@${personaEtiquetada.split('@')[0]}` : "a todos";

        // Llamada a la API de Stellar
        const response = await axios.get(`https://api.stellarwa.xyz/nsfw/interaction?inter=${apiAction}&key=${apiKey}`);
        const gifUrl = response.data.result;

        if (!gifUrl) throw new Error("Link no encontrado en la API");

        // Mensajes personalizados según la acción
       const frases = {
            spank: `✋ *${emisor}* le arrimó un nalgadón marca diablo a ${textoMencion}!`,
            undress: `😏 *${emisor}* está dejando encueradito(a) a ${textoMencion}...`,
            yuri: `👩‍❤️‍💋‍👩 *${emisor}* está haciendo unas tijeras bien intensas con ${textoMencion}!`,
            sixnine: `🔄 *${emisor}* y ${textoMencion} se están dando un 69 bien sabroso!`,
            anal: `🍑 *${emisor}* le dio por el nudo de globo a ${textoMencion}!`,
            fuck: `🔥 *${emisor}* se está cogiendo rico a ${textoMencion}!`,
            cummouth: `👅 *${emisor}* le llenó la boquita de leche a ${textoMencion}!`,
            suckboobs: `🍼 *${emisor}* le está amamantando las nenas a ${textoMencion}!`,
            cumshot: `💦 *${emisor}* le dio un baño de pintura blanca a ${textoMencion}!`,
            lickpussy: `🐱 *${emisor}* le está dando una buena lamida de sapito a ${textoMencion}!`,
            lickdick: `🍌 *${emisor}* está saboreando el "amigo" de ${textoMencion}!`,
            lickass: `👅 *${emisor}* le está limpiando el asterisco a ${textoMencion}!`,
            handjob: `✊ *${emisor}* le está haciendo una paja de campeonato a ${textoMencion}!`,
            grope: `👋 *${emisor}* le está arrimando un buen manoseo a ${textoMencion}!`,
            cum: `💦 *${emisor}* se vino todito sobre ${textoMencion}!`,
            fingering: `✌️ *${emisor}* le está metiendo los dedos hasta el fondo a ${textoMencion}!`,
            creampie: `🥧 *${emisor}* le dejó un pastelito de crema adentro a ${textoMencion}!`,
            facesitting: `🪑 *${emisor}* le está usando la cara de silla a ${textoMencion}!`,
            futanari: `🧬 *${emisor}* le enseñó su "sorpresa" a ${textoMencion}!`,
            pegging: `🍆 *${emisor}* le dio una probadita de su propio chocolate a ${textoMencion}!`,
            bondage: `⛓️ *${emisor}* dejó bien amarradito(a) y sin escape a ${textoMencion}!`,
            deepthroat: `🐍 *${emisor}* se la tragó todita hasta la garganta a ${textoMencion}!`,
            thighjob: `🦵 *${emisor}* le está dando entre las piernas a ${textoMencion}!`,
            yaoi: `👬 *${emisor}* y ${textoMencion} están en un momento muy "bro"...`,
            bukkake: `🥛 *${emisor}* y sus compas bañaron en leche a ${textoMencion}!`,
            orgy: `👯‍♂️ *${emisor}* se metió en una orgía con ${textoMencion} y medio mundo!`,
            grabboobs: `🍒 *${emisor}* le agarró las nenas con ganas a ${textoMencion}!`,
            blowjob: `👅 *${emisor}* le está dando una mamada de leyenda a ${textoMencion}!`,
            boobjob: `🍒 *${emisor}* le está haciendo una rusa fenomenal a ${textoMencion}!`,
            fap: `✊ *${emisor}* se está haciendo una paja pensando en ${textoMencion}!`,
            footjob: `👣 *${emisor}* le está haciendo una paja con los pies a ${textoMencion}!`,
            squirting: `🌊 *${emisor}* hizo que ${textoMencion} mojara hasta las sábanas!`
        };
        const caption = frases[apiAction] || `🔞 *${emisor}* está haciendo ${apiAction} con ${textoMencion}!`;

        // Enviamos el video como GIF
        await sock.sendMessage(from, { 
            video: { url: gifUrl }, 
            caption: caption,
            gifPlayback: true,
            mentions: personaEtiquetada ? [personaEtiquetada] : [] 
        }, { quoted: m });

        return; //

    } catch (e) {
        console.error(`ERROR EN NSFW:`, e.message);
        await sock.sendMessage(from, { text: '❌ La API de Stellar anda lenta o el link falló. Intenta de nuevo.' });
    }
}

        //////////




///////////////



//////////////




/////////////



/////////////


       switch (command) {

case 'play': case 'playlist': { 
if (!text) return sock.sendMessage(from, { text: '¿Qué playlist buscamos, pariente?' });

    try {
        const axios = require('axios');
        const yts = require('yt-search');
        const apiKey = 'sylphy-ty5xtWm';
        
        await sock.sendMessage(from, { text: `🔎 *Buscando:* _${text}_...` });

        let playlistUrl = '';
        let playlistTitle = '';

        // --- PASO 1: Intentar con Spotify API ---
        try {
            const searchRes = await axios.get(`https://sylphy.xyz/search/spotify`, {
                params: { q: text, api_key: apiKey },
                timeout: 5000 
            });
            
            if (searchRes.data?.result?.[0]?.url) {
                playlistUrl = searchRes.data.result[0].url;
                playlistTitle = searchRes.data.result[0].title;
            }
        } catch (e) { 
            console.log("⚠️ Spotify API falló, activando respaldo YT..."); 
        }

        // --- PASO 2: Si Spotify falló, usamos YT-Search para hallar una lista ---
        if (!playlistUrl) {
            const ytSearch = await yts({ query: text, category: 'playlist' });
            if (ytSearch.playlists && ytSearch.playlists.length > 0) {
                playlistUrl = ytSearch.playlists[0].url;
                playlistTitle = ytSearch.playlists[0].title;
            }
        }

        if (!playlistUrl) {
            return sock.sendMessage(from, { text: '❌ No hallé ninguna playlist con ese nombre ni en Spotify ni en YT.' });
        }

        await sock.sendMessage(from, { text: `✅ *Encontrada:* _${playlistTitle}_\n🎧 *Descargando temas principales...*` });

        // --- PASO 3: Extraer y Descargar ---
        // Si es de YT, usamos yt-search para sacar los videos. Si es de Spotify, usamos getTracks.
        let canciones = [];
        if (playlistUrl.includes('youtube.com')) {
            const listData = await yts({ listId: playlistUrl.split('list=')[1] });
            canciones = listData.videos.slice(0, 5); // Bajamos 5
        } else {
            const tracks = await getTracks(playlistUrl);
            canciones = tracks.slice(0, 5);
        }

        for (let track of canciones) {
            try {
                // Buscamos el link de descarga (usamos el endpoint de YT-MP3 que es más estable que el de Spotify)
                const targetUrl = track.url || track.external_urls?.spotify || `https://www.youtube.com/watch?v=${track.videoId}`;
                
                const dlRes = await axios.get(`https://sylphy.xyz/download/ytmp3?url=${encodeURIComponent(targetUrl)}&api_key=${apiKey}`);
                
                if (dlRes.data?.result?.dl_url) {
                    await sock.sendMessage(from, { 
                        audio: { url: dlRes.data.result.dl_url }, 
                        mimetype: 'audio/mp4', 
                        fileName: `${track.title || track.name}.mp3` 
                    });
                }
                await new Promise(r => setTimeout(r, 4000)); // Pausa de seguridad
            } catch (err) { continue; }
        }

        await sock.sendMessage(from, { text: `✅ *Playlist "${playlistTitle}" terminada.*` });

    } catch (e) {
        console.error("ERROR FINAL:", e);
        await sock.sendMessage(from, { text: '❌ Error al procesar la solicitud.' });
    }
}
break;

case 'album': {
    if (!text) return sock.sendMessage(from, { text: '¿De quién buscamos el álbum, pariente?' });

    try {
        const yts = require('yt-search');
        const axios = require('axios');
        const apiKey = 'sylphy-ty5xtWm';

        const search = await yts(text);
        if (!search || !search.videos.length) return sock.sendMessage(from, { text: '❌ No hallé nada.' });

        const canciones = search.videos.slice(0, 5); // Bajamos 5 para probar estabilidad
        await sock.sendMessage(from, { text: `💿 Preparando *${canciones.length}* canciones. Esto evita el error de 0kb, aguanta...` });

        for (let v of canciones) {
            try {
                // 1. Obtenemos el link de la API
                const res = await axios.get(`https://sylphy.xyz/download/ytmp3?url=${encodeURIComponent(v.url)}&api_key=${apiKey}`);
                const dl_url = res.data.result?.dl_url;

                if (dl_url) {
                    // 2. DESCARGA DIRECTA AL BUFFER (Aquí está el truco)
                    // Bajamos el archivo al bot primero para asegurar que pese lo que debe
                    const response = await axios.get(dl_url, { 
                        responseType: 'arraybuffer',
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    // 3. Enviamos el Buffer de audio
                    await sock.sendMessage(from, { 
                        audio: Buffer.from(response.data), 
                        mimetype: 'audio/mp4', 
                        fileName: `${v.title}.mp3` 
                    }, { quoted: m });
                }

                // Pausa de 3 segundos para no saturar la RAM de Railway
                await new Promise(r => setTimeout(r, 3000));

            } catch (err) {
                console.error(`Error en rola: ${v.title}`, err.message);
                continue;
            }
        }
        await sock.sendMessage(from, { text: '✅ *Álbum enviado con éxito.*' });

    } catch (e) {
        console.error("ERROR ALBUM:", e);
        await sock.sendMessage(from, { text: '❌ Error al procesar el álbum.' });
    }
}
break;

case 'pin': case 'pinterest': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué buscamos en Pinterest? Ejemplo: .pin yamaha mt09' });

    try {
        const axios = require('axios');
        const response = await axios.get(`https://api.evogb.org/search/pinterestv2?query=${encodeURIComponent(text)}`);
        
        // 1. Accedemos a la lista de "pins" según la estructura que mandaste
        const pins = response.data.response?.pins;

        if (!pins || pins.length === 0) {
            return sock.sendMessage(from, { text: `❌ No encontré nada para: *${text}*` });
        }

        // 2. Agarramos el primero (o podrías usar Math.random para que varíe)
        const pin = pins[0];

        // 3. Sacamos la URL original (la de mejor calidad)
        const imageUrl = pin.media?.images?.orig?.url;

        if (!imageUrl) {
            return sock.sendMessage(from, { text: '⚠️ No pude extraer la imagen de este resultado.' });
        }

        // 4. Mandamos la imagen con su título si tiene
        await sock.sendMessage(from, { 
            image: { url: imageUrl }, 
            caption: `📌 *Pinterest:* ${pin.title || text}\n👤 *Subido por:* ${pin.uploader?.full_name || 'Desconocido'}` 
        }, { quoted: m });

    } catch (e) {
        console.error("ERROR PINTEREST:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un fallo al conectar con la API de Pinterest.' });
    }
}
break;




//////////////////////// copilot ///////////////
case 'cop': case 'copilot': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué onda, pariente? Suéltame tu duda para el Copilot.' });

    try {
        const axios = require('axios');
        
        // 1. Usamos los nombres de parámetros que SÍ funcionan: "text" y "key"
        const key = 'evogb-WcaOh0yE';
        const urlFinal = `https://api.evogb.org/ai/copilot?text=${encodeURIComponent(text)}&key=${key}`;

        // 2. Hacemos la petición GET
        const response = await axios.get(urlFinal);

        // 3. Extraemos la respuesta (GataDios suele devolverlo en .result)
        const respuestaIA = response.data.result || response.data.response || response.data.data;

        if (!respuestaIA) {
            return sock.sendMessage(from, { text: '⚠️ La API respondió pero el mensaje vino vacío, compa.' });
        }

        await sock.sendMessage(from, { 
            text: `✨ *Copilot AI* \n\n${respuestaIA.trim()}` 
        }, { quoted: m });

    } catch (e) {
        console.error("ERROR COPILOT:", e.message);
        await sock.sendMessage(from, { text: '❌ No pude conectar con el Copilot, anda de flojo el servidor.' });
    }
}
break;

///////////
case 'letra': case 'lyrics': {
    if (!text) return sock.sendMessage(from, { text: '¿De qué rola quieres la letra, pariente? Ejemplo: .letra El Azul' });

    try {
        const axios = require('axios');
        const apiKey = 'sylphy-ty5xtWm';
        
        // Avisamos que estamos buscando
        await sock.sendMessage(from, { text: '🔍 *Buscando la letra...* Aguanta.' });

        // 1. Hacemos la petición a Sylphy
        const response = await axios.get(`https://sylphy.xyz/search/lyrics?title=${encodeURIComponent(text)}&api_key=${apiKey}`);

        // 2. Extraemos los datos (Ajustado a como suelen responder estas APIs)
        const data = response.data.result || response.data; 

        if (!data || !data.lyrics) {
            return sock.sendMessage(from, { text: `❌ No hallé la letra de *${text}*. Intenta con el nombre del artista también.` });
        }

        // 3. Formateamos el mensaje
        const mensajeLetra =  `${data.lyrics}\n\n` 
                             
        await sock.sendMessage(from, { text: mensajeLetra }, { quoted: m });

    } catch (e) {
        console.error("ERROR LYRICS:", e.message);
        await sock.sendMessage(from, { text: '❌ no encontre la letra.' });
    }
}
break;
//////////

case 'brat': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué frase quieres en el sticker, pariente? Ejemplo: *.brat La MT09*' });

    try {
        const axios = require('axios');
        const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter'); // Asegúrate de tener esta librería

        // 1. Aviso de que el bot está "chambeando"
        await sock.sendMessage(from, { text: '🎨 *Cocinando tu sticker estilo Brat...*' });

        // 2. Construimos la URL con tu API Key
        // Dejamos color y fondo vacíos para que use el verde clásico por defecto
        const apiKey = 'sylphy-ty5xtWm';
        const urlBrat = `https://sylphy.xyz/tools/brat?text=${encodeURIComponent(text)}&color=&fondo=&type=&api_key=${apiKey}`;

        // 3. Descargamos la imagen como Buffer
        const response = await axios.get(urlBrat, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');

        // 4. Convertimos a Sticker (usando wa-sticker-formatter)
        const sticker = new Sticker(buffer, {
            pack: 'Pack Maestro', // Nombre del paquete
            author: 'Bot Maestro', // Tu nombre
            type: StickerTypes.FULL,
            categories: ['🤩', '✨'],
            id: '12345',
            quality: 70,
        });

        const stickerBuffer = await sticker.toBuffer();

        // 5. Enviamos el sticker final
        await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

    } catch (e) {
        console.error("ERROR BRAT:", e.message);
        await sock.sendMessage(from, { text: '❌ No pude crear el sticker. Revisa si la frase es muy larga o si la API anda caída.' });
    }
}
break;

/////////

case 'fuck': {
 
 
 if (isGroup && db.groups[from]?.sfw) {
        return sock.sendMessage(from, { text: '🚫 *Comando Bloqueado:* El modo NSFW está activo en este grupo. ¡Pórtense bien!' }, { quoted: m });
    }
 
    try {
        const apiKey = 'sylphy-ty5xtWm';
        const emisor = m.pushName || 'Usuario';

        // 1. Detección de objetivo
        let personaEtiquetada = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant || null;
        let textoMencion = personaEtiquetada ? `@${personaEtiquetada.split('@')[0]}` : "a todos";

        // 2. Llamada a la API con respuesta tipo 'arraybuffer' por si mandan el video directo
        const response = await axios.get(`https://sylphy.xyz/reaction/fuck?api_key=${apiKey}`, {
            responseType: 'arraybuffer' 
        });

        // 3. Verificar qué nos llegó
        const contentType = response.headers['content-type'];
        
        if (contentType.includes('video') || contentType.includes('image')) {
            // SI ES UN VIDEO/GIF DIRECTO (Lo que te pasó recién)
            await sock.sendMessage(from, { 
                video: response.data, // Enviamos el buffer directamente
                caption: `*${emisor}* se esta cogiendo a ${textoMencion}!`,
                gifPlayback: true,
                mentions: personaEtiquetada ? [personaEtiquetada] : [] 
            }, { quoted: m });
            
        } else {
            // SI ES UN JSON (Con un link adentro)
            const data = JSON.parse(response.data.toString());
            let gifUrl = data.url || data.result || data.link;
            
            await sock.sendMessage(from, { 
                video: { url: gifUrl }, 
                caption: `🖕 *${emisor}* se cogio a  ${textoMencion}!`,
                gifPlayback: true,
                mentions: personaEtiquetada ? [personaEtiquetada] : [] 
            }, { quoted: m });
        }

    } catch (e) {
        console.error("ERROR EN FUCK:", e.message);
        await sock.sendMessage(from, { text: '❌ Hubo un error al obtener el GIF.' });
    }
}
break;
//////////

case 'r34': {
  
  if (isGroup && db.groups[from]?.sfw) {
        return sock.sendMessage(from, { text: '🚫 *Comando Bloqueado:* El modo NSFW está activo en este grupo. ¡Pórtense bien!' }, { quoted: m });
    }
  
    if (!text) return await sock.sendMessage(from, { text: '❌ Escribe qué buscar. Ejemplo: .r34 fortnite' }, { quoted: m });
    
    try {
        const apiKey = 'sylphy-ty5xtWm';
        const searchUrl = `https://sylphy.xyz/search/rule34?text=${encodeURIComponent(text)}&api_key=${apiKey}`;
        
        const response = await axios.get(searchUrl);
        const res = response.data;

        // La API devuelve un array de strings directamente
        let results = Array.isArray(res) ? res : (res.result || res.data || []);

        if (results && results.length > 0) {
            // Tomamos un enlace al azar del array
            let mediaUrl = results[Math.floor(Math.random() * results.length)];
            
            // Verificamos que sea un string válido y que empiece con http
            if (typeof mediaUrl !== 'string' || !mediaUrl.startsWith('http')) {
                return await sock.sendMessage(from, { text: '❌ No se recibió un enlace válido.' }, { quoted: m });
            }

            console.log("Enviando media:", mediaUrl);

            // Identificar si es video o imagen por la extensión
            const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|webm|mov)$/);

            if (isVideo) {
                await sock.sendMessage(from, { 
                    video: { url: mediaUrl }, 
                    caption: `🔞 *Video de:* ${text}` 
                }, { quoted: m });
            } else {
                await sock.sendMessage(from, { 
                    image: { url: mediaUrl }, 
                    caption: `🔞 *Resultado para:* ${text}` 
                }, { quoted: m });
            }
        } else {
            await sock.sendMessage(from, { text: `❌ No hay resultados para "${text}".` }, { quoted: m });
        }
    } catch (e) {
        console.error("Error en R34:", e.message);
        await sock.sendMessage(from, { text: '❌ Hubo un fallo en la conexión.' }, { quoted: m });
    }
}
break;

//////////

case 'ytaudio': case 'audio': {
    const axios = require('axios');
    const yts = require('yt-search');

    const query = args.join(' ');
    if (!query) return sock.sendMessage(from, { text: '⚠️ ¡Epa! Escribe el nombre o pega el link, pariente.' }, { quoted: m });

    try {
        let videoData = null;

        // 1. REACCIÓN INICIAL (⏳)
        await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // 2. OBTENER INFORMACIÓN DEL VIDEO
        if (query.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
            const videoId = yts.parseVideoId(query);
            videoData = await yts({ videoId: videoId });
        } else {
            const search = await yts(query);
            if (!search || !search.videos.length) {
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                return sock.sendMessage(from, { text: '❌ No encontré esa rola.' });
            }
            videoData = search.videos[0];
        }

        const videoUrl = videoData.url;
        const videoTitle = videoData.title;
        const vistas = (videoData.views || 0).toLocaleString();
        const canal = videoData.author?.name || 'Desconocido';

        // 3. ENVIAR FICHA TÉCNICA CON MINIATURA
        const infoMessage = `➩ Descargando Audio › *${videoTitle}*

> ❖ Canal › *${canal}*
> ⴵ Duración › *${videoData.timestamp || '??:??'}*
> ❀ Vistas › *${vistas}*
> ✩ Publicado › *${videoData.ago || 'Reciente'}*
> ❒ Enlace › *${videoUrl}*`;

        await sock.sendMessage(from, { 
            image: { url: videoData.image || videoData.thumbnail }, 
            caption: infoMessage 
        }, { quoted: m });

        // 4. LLAMADA A LA API (Sylphy)
        const apiUrl = `https://sylphy.xyz/download/ytmp3?url=${encodeURIComponent(videoUrl)}&api_key=${SYLPHY_KEY}`;
        const res = await axios.get(apiUrl);
        const downloadUrl = res.data.result?.dl_url;

        if (!downloadUrl) {
            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            return sock.sendMessage(from, { text: '❌ La API no soltó el link. Intenta con otra rola.' });
        }

        // 5. ENVIAR EL ARCHIVO DE AUDIO
        await sock.sendMessage(from, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${videoTitle}.mp3`
        }, { quoted: m });

        // REACCIÓN DE ÉXITO (✅)
        await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
        console.log(`[✅] Audio enviado: ${videoTitle}`);

    } catch (e) {
        console.error("ERROR EN YTAUDIO:", e.message);
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(from, { text: '❌ Valio queso, el servidor está saturado.' });
    }
}
break;

////////

case 'video': case 'ytvideo': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué video buscamos, pariente? Pasa el nombre o link.' });
    
    try {
        const yts = require('yt-search');
        const axios = require('axios');
        let videoData = null;

        // 1. REACCIÓN DE "ESPERA"
        await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // 2. OBTENER INFORMACIÓN (Link o Texto)
        if (text.includes('youtu.be') || text.includes('youtube.com')) {
            const videoId = yts.parseVideoId(text);
            videoData = await yts({ videoId: videoId });
        } else {
            const search = await yts(text);
            if (!search.videos.length) {
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
                return sock.sendMessage(from, { text: '❌ No hallé el video.' });
            }
            videoData = search.videos[0];
        }

        const videoUrl = videoData.url;
        const videoTitle = videoData.title;
        const vistas = (videoData.views || 0).toLocaleString();
        const canal = videoData.author?.name || 'Desconocido';

        // 3. ENVIAR FICHA TÉCNICA (Miniatura + Info)
        const infoMessage = `➩ Descargando Video › *${videoTitle}*

> ❖ Canal › *${canal}*
> ⴵ Duración › *${videoData.timestamp || '??:??'}*
> ❀ Vistas › *${vistas}*
> ✩ Publicado › *${videoData.ago || 'Reciente'}*
> ❒ Enlace › *${videoUrl}*`;

        await sock.sendMessage(from, { 
            image: { url: videoData.image || videoData.thumbnail }, 
            caption: infoMessage 
        }, { quoted: m });

        // 4. DESCARGA DESDE LA API
        const res = await axios.get(`https://sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&api_key=sylphy-ty5xtWm`);
        const dl_url = res.data.result?.dl_url;

        if (dl_url) {
            await sock.sendMessage(from, { 
                video: { 
                    url: dl_url,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                }, 
                caption: `✅ *${videoTitle}*`,
                mimetype: 'video/mp4',
                fileName: `${videoTitle}.mp4`
            }, { quoted: m });

            // REACCIÓN DE "ÉXITO"
            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            throw new Error("No link");
        }
    } catch (e) {
        console.error("ERROR VIDEO:", e.message);
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(from, { text: '❌ Falló la descarga. Intenta de nuevo más tarde.' });
    }
}
break;

//////////


case 'kill':
case 'matar': {
    
    if (isGroup && db.groups[from]?.sfw) {
        return sock.sendMessage(from, { text: '🚫 *Comando Bloqueado:* El modo NSFW está activo en este grupo. ¡Pórtense bien!' }, { quoted: m });
    }
    
    const chatID = m.key.remoteJid;
    const killer = m.sender || m.key.participant || "";
    
    // --- NUEVA DETECCIÓN DE VÍCTIMA ---
    let victim = null;

    // 1. Prioridad: Mención directa (@)
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        victim = m.mentionedJid[0];
    } 
    // 2. Segunda opción: Responder/Reply a un mensaje
    else if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) {
        victim = m.message.extendedTextMessage.contextInfo.participant || m.message.extendedTextMessage.contextInfo.remoteJid;
    }
    // 3. Tercera opción: Si tu estructura usa m.quoted (más común)
    else if (m.quoted) {
        victim = m.quoted.sender;
    }

    // --- CONSTRUCCIÓN DE TEXTOS ---
    const killerTag = `@${killer.split('@')[0]}`;
    let victimTag = victim ? `@${victim.split('@')[0]}` : "a alguien";
    let mentionsList = [killer];
    if (victim) mentionsList.push(victim);

    try {
        console.log(`\n[⚔️] ANALIZANDO KILL:`);
        console.log(`[👤] Asesino: ${killerTag}`);
        console.log(`[🎯] Víctima detectada: ${victimTag}`);
        
        const response = await axios.get('https://api.stellarwa.xyz/sfw/interaction?inter=kill&key=api-qG4nw');
        const url = response.data.result || response.data.url;
        
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        const msgCaption = `${killerTag} mato a ${victimTag}`;

        await sock.sendMessage(chatID, { 
            video: buffer, 
            caption: msgCaption,
            gifPlayback: true,
            mimetype: 'video/mp4',
            mentions: mentionsList
        }, { quoted: m });

        console.log(`[✨] MENSAJE ENVIADO CON ÉXITO\n`);

    } catch (e) {
        console.error(`[🔥] ERROR:`, e.message);
        await sock.sendMessage(chatID, { text: `❌ Error: ${e.message}` });
    }
}
break;
/////////

case 'gemini': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué onda wero? Pregúntame algo con el poder de Gemini 2.5.' });

    // USA TU API KEY NUEVA (La que no termina en lo de antes)
    const apiKey = "AIzaSyAURYgdQYR1Y-RIyXZQD02MlDsyVanzPW8"; 
    
    // URL OFICIAL MARZO 2026 para Gemini 2.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        console.log(`\n[♊] LLAMANDO AL PODEROSO GEMINI 2.5 FLASH: ${text}`);

        const response = await axios.post(url, {
            contents: [{
                role: "user",
                parts: [{ text: text }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            const respuestaIA = response.data.candidates[0].content.parts[0].text;
            
            // Enviamos la respuesta al chat de WhatsApp
            await sock.sendMessage(from, { text: respuestaIA }, { quoted: m });
            console.log(`[✨] ¡CORONAMOS CON 2.5 FLASH!`);
        } else {
            await sock.sendMessage(from, { text: '⚠️ El modelo 2.5 recibió la orden pero no generó texto (posible filtro).' });
        }

    } catch (e) {
        if (e.response) {
            console.error("DETALLE TÉCNICO 2.5:", JSON.stringify(e.response.data));
            const msg = e.response.data.error.message;
            
            // Si te da 404 aquí, revisa en AI Studio que el nombre sea "gemini-2.5-flash"
            // A veces le ponen números extra como "gemini-2.5-flash-001"
            await sock.sendMessage(from, { text: `❌ Error en Gemini 2.5: ${msg}` });
        } else {
            console.error("ERROR:", e.message);
            await sock.sendMessage(from, { text: '❌ Error de conexión con Google Cloud.' });
        }
    }
}
break;
///////////
case 'responde':
case 'ayuda': {
    try {
        // 1. EXTRAER LA IMAGEN (Basado exactamente en tu log)
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const directMsg = m.message?.imageMessage;
        
        // Buscamos la imagen ya sea en la respuesta o en el mensaje directo
        const imgMessage = quotedMsg?.imageMessage || directMsg;

        if (!imgMessage) {
            return sock.sendMessage(from, { text: '❌ No veo la foto, wero. Asegúrate de responder a una imagen con el comando.' });
        }

        // 2. CONFIGURACIÓN (Tu API Key de Gemini 2.5)
        const apiKey = "AIzaSyAURYgdQYR1Y-RIyXZQD02MlDsyVanzPW8"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        await sock.sendMessage(from, { text: '🔍 ¡Ya encontré la foto! Analizando con Gemini 2.5...' });

        // 3. DESCARGAR LA IMAGEN
        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
        const stream = await downloadContentFromMessage(imgMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const base64Image = buffer.toString('base64');

        // 4. PREPARAR EL PROMPT
        const instrucciones = command === 'responde' 
            ? "Resuelve esta tarea o problema de la imagen paso a paso." 
            : "Explícame qué hay en esta foto y ayúdame con lo que se ve.";

        // 5. LLAMADA A TU API
        const response = await axios.post(url, {
            contents: [{
                parts: [
                    { text: instrucciones + (text ? ` Además el usuario dice: ${text}` : "") },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        });

        if (response.data.candidates && response.data.candidates[0].content) {
            const resultado = response.data.candidates[0].content.parts[0].text;
            await sock.sendMessage(from, { text: `${resultado}` }, { quoted: m });
            console.log(`[📸] Tarea resuelta con éxito.`);
        }

    } catch (e) {
        console.error("ERROR:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un fallo al procesar la imagen con la API.' });
    }
}
break;

//////////

case 'yt':
case 'ytsearch': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué quieres buscar en YouTube, wero? Pon: .yt la mejor ram del mundo' });

    try {
        const yts = require('yt-search');
        await sock.sendMessage(from, { text: `🔍 Buscando "${text}" en YouTube...` });

        // Realizamos la búsqueda
        const search = await yts(text);
        const videos = search.videos.slice(0, 10); // Máximo 10 resultados

        if (videos.length === 0) return sock.sendMessage(from, { text: '❌ No encontré nada, wero. Intenta con otras palabras.' });

        let textoBusqueda = `✨ *RESULTADOS DE YOUTUBE* ✨\n\n`;

        // Armamos la lista para enviarla
        videos.forEach((v, i) => {
            textoBusqueda += `*${i + 1}.* 🎥 *${v.title}*\n`;
            textoBusqueda += `   👤 *Autor:* ${v.author.name}\n`;
            textoBusqueda += `   ⏳ *Duración:* ${v.timestamp}\n`;
            textoBusqueda += `   🔗 *Enlace:* ${v.url}\n\n`;
        });

        textoBusqueda += `_Escribe el enlace para descargarlo si tienes el comando activado._`;

        // Mandamos la miniatura del primer video para que se vea pro
        await sock.sendMessage(from, { 
            image: { url: videos[0].thumbnail }, 
            caption: textoBusqueda 
        }, { quoted: m });

        console.log(`[📺] Búsqueda de YT entregada para: ${text}`);

    } catch (e) {
        console.error("ERROR EN YTSEARCH:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un fallo al buscar en YouTube.' });
    }
}
break;

//////////

case 'nsfw': {
    if (!isGroup) return sock.sendMessage(from, { text: '❌ Este comando solo sirve en grupos, pariente.' });
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ Solo los admins pueden moverle a esto.' });

    if (text === 'on') {
        // ACTIVAR EL DESMADRE (Apagamos el filtro SFW)
        db.groups[from].sfw = false; 
        saveDB();
        await sock.sendMessage(from, { text: '😈 *Modo NSFW Activado.* \nYa pueden usar .fuck y .r34. ¡Bajo su propio riesgo!' });
    } else if (text === 'off') {
        // DESACTIVAR EL DESMADRE (Prendemos el filtro SFW)
        db.groups[from].sfw = true; 
        saveDB();
        await sock.sendMessage(from, { text: '😇 *Modo NSFW Desactivado.* \nComandos prohibidos bloqueados. ¡Pórtense bien!' });
    } else {
        const estado = !db.groups[from].sfw ? "ON (Activado 🔞)" : "OFF (Desactivado 😇)";
        await sock.sendMessage(from, { text: `🧐 El modo NSFW está: *${estado}*\n\nUsa:\n*.nsfw on* para permitir desmadre.\n*.nsfw off* para prohibirlo.` });
    }
}
break;

////////

case 'ig': case 'instagram': {
    const query = (text || "").trim();
    if (!query || !query.includes('instagram.com')) {
        return await sock.sendMessage(from, { text: '❌ Pega un link de Instagram, pariente.' }, { quoted: m });
    }

    const apiKey = 'sylphy-ty5xtWm';

    try {
        console.log(`\n[📸] --- DESCARGA IG: SOLO VIDEOS ---`);
        await sock.sendMessage(from, { text: '⏳ Buscando el video... aguanta.' }, { quoted: m });

        // Intento con la API principal
        let res = await axios.get(`https://sylphy.xyz/download/instagram?url=${encodeURIComponent(query)}&api_key=${apiKey}`);
        let results = res.data.result || res.data.data || [];

        // Intento con la de respaldo si la primera falló
        if (!results || results.length === 0) {
            const res2 = await axios.get(`https://a-s-s-u.vercel.app/api/download/instagram?url=${encodeURIComponent(query)}`);
            results = res2.data.result || res2.data.data || [];
        }

        if (!results || results.length === 0) {
            return await sock.sendMessage(from, { text: '❌ No hallé nada en este link.' });
        }

        // --- FILTRAR SOLO VIDEOS ---
        const videoLinks = results.filter(item => {
            let link = String(item.url || item.dl_url || item).toLowerCase();
            // Solo aceptamos si trae mp4 o no trae extensiones de foto comunes
            return link.includes('mp4') || (link.includes('video') && !link.includes('.jpg'));
        });

        if (videoLinks.length === 0) {
            return await sock.sendMessage(from, { text: '⚠️ El link no contiene videos (parece ser solo una foto).' });
        }

        console.log(`[📹] Mandando ${videoLinks.length} video(s)...`);

        for (let videoItem of videoLinks) {
            let dlUrl = videoItem.url || videoItem.dl_url || videoItem;
            
            // Descarga a Buffer para asegurar que no falle en WhatsApp
            const response = await axios.get(dlUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');

            await sock.sendMessage(from, { 
                video: buffer, 
                caption: `✅ *Instagram Video*`,
                mimetype: 'video/mp4',
                fileName: `ig_video_${Date.now()}.mp4`
            }, { quoted: m });
        }

        console.log(`[✨] ¡Video enviado con éxito!`);

    } catch (e) {
        console.error("ERROR EN IG:", e.message);
        await sock.sendMessage(from, { text: '❌ Hubo un error al procesar el video. Intenta de nuevo.' });
    }
}
break;

////////

case 'anal': {
    // 1. Verificación de SFW (Si el grupo tiene bloqueado lo NSFW)
    if (isGroup && db.groups[from]?.sfw) {
        return sock.sendMessage(from, { text: '🚫 *Comando Bloqueado:* El modo SFW está activo. ¡Aquí no se puede, pariente!' }, { quoted: m });
    }

    try {
        const apiKey = 'api-qG4nw'; // Tu llave de Stellar
        const emisor = m.pushName || 'Usuario';

        // 2. Detección de a quién le van a dar (mención o respuesta)
        let personaEtiquetada = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                                m.message?.extendedTextMessage?.contextInfo?.participant || null;
        let textoMencion = personaEtiquetada ? `@${personaEtiquetada.split('@')[0]}` : "a todos";

        // 3. Llamada a la API de Stellar
        // Nota: Stellar siempre responde con JSON, así que no ocupamos arraybuffer aquí
        const response = await axios.get(`https://api.stellarwa.xyz/nsfw/interaction?inter=anal&key=${apiKey}`);
        
        // 4. Extraer el link del video/gif del JSON de Stellar
        // Stellar suele devolver { status: 200, result: "url_del_video" }
        const gifUrl = response.data.result;

        if (!gifUrl) throw new Error("La API no mandó link.");

        // 5. Envío del video como GIF (gifPlayback: true)
        await sock.sendMessage(from, { 
            video: { url: gifUrl }, 
            caption: `😈 *${emisor}* le está dando por atrás a ${textoMencion}!`,
            gifPlayback: true,
            mentions: personaEtiquetada ? [personaEtiquetada] : [] 
        }, { quoted: m });

    } catch (e) {
        console.error("ERROR EN ANAL:", e.message);
        await sock.sendMessage(from, { text: '❌ Valio queso, no pude conseguir el video. Intenta de nuevo.' });
    }
}
break;

/////////

case 'cum': {
    // 1. Verificación de SFW
    if (isGroup && db.groups[from]?.sfw) {
        return sock.sendMessage(from, { text: '🚫 *Comando Bloqueado:* El modo SFW está activo. ¡Nada de cochinadas aquí!' }, { quoted: m });
    }

    try {
        const apiKey = 'api-qG4nw'; // Tu llave de Stellar
        const emisor = m.pushName || 'Usuario';

        // 2. ¿A quién le toca el baño? (mención o respuesta)
        let personaEtiquetada = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                                m.message?.extendedTextMessage?.contextInfo?.participant || null;
        let textoMencion = personaEtiquetada ? `@${personaEtiquetada.split('@')[0]}` : "a todos";

        // 3. Llamada a la API (Cambiamos 'anal' por 'cum')
        const response = await axios.get(`https://api.stellarwa.xyz/nsfw/interaction?inter=cum&key=${apiKey}`);
        
        // 4. Extraer el link del video
        const gifUrl = response.data.result;

        if (!gifUrl) throw new Error("La API no mandó el link del video.");

        // 5. Envío del video/gif
        await sock.sendMessage(from, { 
            video: { url: gifUrl }, 
            caption: `💦 *${emisor}* se vino todito sobre ${textoMencion}!`,
            gifPlayback: true,
            mentions: personaEtiquetada ? [personaEtiquetada] : [] 
        }, { quoted: m });

    } catch (e) {
        console.error("ERROR EN CUM:", e.message);
        await sock.sendMessage(from, { text: '❌ No pude cargar el video, pariente. Intenta de nuevo.' });
    }
}
break;

/////////


/////////

case 'nsfwmenu': {
    const emisor = m.pushName || 'Usuario';
    const nsfwStatus = (isGroup && db.groups[from]?.sfw) ? '🔴 *DESACTIVADO*' : '🟢 *ACTIVADO*';

    let menuText = `🔞 *MENU DE INTERACCIONES NSFW* 🔞\n\n`;
    menuText += `👤 *Usuario:* ${emisor}\n`;
    menuText += `🛡️ *Estado SFW:* ${nsfwStatus}\n`;
    menuText += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    menuText += `🔥 *ACCIÓN DIRECTA:* \n`;
    menuText += `• .fuck | .coger\n• .anal | .violar\n• .cum | .venirse\n• .squirt | .squirting\n• .creampie\n• .pegging\n\n`;
    menuText += `👅 *PLACER ORAL & MÁS:* \n`;
    menuText += `• .bj | .mamada | .blowjob\n• .cummouth\n• .deepthroat | .garganta\n• .lickpussy\n• .lickdick\n• .lickass\n\n`;
    menuText += `🍒 *PECHOS & MANOS:* \n`;
    menuText += `• .boobjob | .rusa\n• .suckboobs\n• .grabboobs\n• .handjob\n• .paja | .fap\n• .footjob\n• .thighjob\n\n`;
    menuText += `⛓️ *FETICHES & GRUPALES:* \n`;
    menuText += `• .bondage\n• .orgy | .orgia\n• .bukkake\n• .facesitting\n• .fingering\n• .grope\n\n`;
    menuText += `💖 *VARIADOS:* \n`;
    menuText += `• .yuri | .tijeras\n• .yaoi\n• .futa | .futanari\n• .69 | .sixnine\n• .undress | .encuerar\n• .spank | .nalgada\n\n`;
    menuText += `⚠️ *Nota:* Etiqueta a alguien o responde a su mensaje para aplicar la acción directamente a esa persona.`;

    // Si tienes una imagen para el menú, cámbiala aquí:
    const imagenMenu = 'https://i.imgur.com/your-image-here.jpg'; // Pon el link de una imagen chila

    await sock.sendMessage(from, { 
        image: { url: imagenMenu }, 
        caption: menuText 
    }, { quoted: m });
}
break;
////////

case 'manga': {
    if (!text.includes('http')) return m.reply("🔗 ¡Pásame el link del capítulo de Nanatsu no Taizai, pariente!");

    const tempDir = `./temp_manga_${Date.now()}`;
    const pdfPath = `${tempDir}/capitulo.pdf`;

    try {
        m.reply("⏳ *Procesando manga...* Estoy creando el PDF, esto puede tardar un poco dependiendo de las páginas.");

        // 1. Obtener los enlaces de las imágenes de la API
        const response = await axios.get(`https://apis-starlights-team.koyeb.app/starlight/mangadl?url=${text}`);
        const data = response.data.result;
        if (!data || !data.pages) return m.reply("❌ No encontré contenido en ese enlace.");

        // Crear carpeta temporal
        await fs.ensureDir(tempDir);

        // 2. Crear el documento PDF
        const doc = new PDFDocument({ autoFirstPage: false });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // 3. Descargar cada imagen y meterla al PDF
        for (const url of data.pages) {
            const imgRes = await axios.get(url, { responseType: 'arraybuffer' });
            const imgBuffer = Buffer.from(imgRes.data);
            
            const img = doc.openImage(imgBuffer);
            doc.addPage({ size: [img.width, img.height] });
            doc.image(imgBuffer, 0, 0);
        }

        doc.end();

        // Esperar a que el archivo se termine de escribir
        stream.on('finish', async () => {
            // 4. Enviar el PDF al usuario
            await sock.sendMessage(m.chat, { 
                document: fs.readFileSync(pdfPath), 
                fileName: `${data.title}.pdf`, 
                mimetype: 'application/pdf',
                caption: `📖 *${data.title}*\n✅ ¡Listo para leer, pariente!`
            }, { quoted: m });

            // 5. Limpieza total (borrar PDF y carpeta temporal)
            await fs.remove(tempDir);
        });

    } catch (e) {
        console.error(e);
        m.reply("❌ Hubo un error al generar el PDF. Revisa el link o intenta más tarde.");
        await fs.remove(tempDir);
    }
}
break;
////////

case 'imagen': case 'img': case 'image': {
    const axios = require('axios');
    const text = args.join(' ');
    
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Por favor, ingresa un término de búsqueda.\n✐ Ejemplo: .img Yamaha MT09` }, { quoted: m });

    // Lista de palabras prohibidas (Resumida para no ocupar tanto espacio, puedes dejar la tuya completa)
    const bannedWords = ['+18', 'porn', 'sexo', 'xxx', 'hentai', 'desnudo']; 
    const lowerText = text.toLowerCase();
    
    // Filtro NSFW (Si en tu db no tienes nsfw, esto lo bloquea por defecto)
    const nsfwEnabled = db.chats?.[from]?.nsfw === true;
    if (!nsfwEnabled && bannedWords.some(word => lowerText.includes(word))) {
        return await sock.sendMessage(from, { text: '《✧》 Este comando no permite búsquedas de contenido *+18*.' }, { quoted: m });
    }

    try {
        // 1. Buscamos las imágenes (Usando una API pública estable)
        // Nota: He puesto una URL directa para que no dependas de global.APIs
        const res = await axios.get(`https://api.screenshotlayer.com/api/search?query=${encodeURIComponent(text)}`).catch(() => null);
        
        // Si esa falla, usamos esta otra que es muy buena para bots:
        const searchUrl = `https://api.egglord.xyz/api/search/google-images?query=${encodeURIComponent(text)}`;
        const response = await axios.get(searchUrl);
        const results = response.data.results || [];

        if (results.length === 0) return await sock.sendMessage(from, { text: '《✧》 No encontré imágenes para esa búsqueda.' }, { quoted: m });

        // 2. Seleccionamos la primera imagen válida
        const imgUrl = results[0].url;

        // 3. Enviamos la imagen con el diseño que te gusta
        await sock.sendMessage(from, { 
            image: { url: imgUrl }, 
            caption: `ㅤ۟∩　ׅ　★　ׅ　🅖oogle 🅘mage 🅢earch　ׄᰙ　\n\n` +
                     `𖣣ֶㅤ֯⌗ ☆  ⬭ *Búsqueda* › ${text}\n` +
                     `𖣣ֶㅤ֯⌗ ☆  ⬭ *Fuente* › Google`
        }, { quoted: m });

    } catch (e) {
        console.log(e);
        await sock.sendMessage(from, { text: `> Ocurrió un error al buscar la imagen.` }, { quoted: m });
    }
}
break;
///////

case 'hd': case 'remini': case 'enhance': {
    const axios = require('axios');
    const FormData = require('form-data');
    
    // --- 1. DETECCIÓN ULTRA-SEGURA DE LA IMAGEN ---
    // Buscamos el mime type en:
    // a) El mensaje actual (m.mimetype)
    // b) Un mensaje citado (m.quoted?.mimetype)
    // c) Un mensaje de imagen directo (m.msg?.mimetype)
    const mime = m.mimetype || m.quoted?.mimetype || m.msg?.mimetype || '';
    
    // Si no hay mime type de imagen, mandamos el error
    if (!mime || !/image\/(jpe?g|png|webp)/.test(mime)) {
        return await sock.sendMessage(from, { 
            text: `《✧》 Por favor, *responde* a una imagen o *mándala* con el comando *${prefix + command}*.` 
        }, { quoted: m });
    }

    // --- 2. INICIAR PROCESO DE MEJORA ---
    await sock.sendMessage(from, { text: '`⏳ Mejorando calidad... esto puede tardar unos segundos.`' }, { quoted: m });

    try {
        // 3. Descargar la imagen del mensaje correcto (actual o citado)
        const q = m.quoted || m;
        const buffer = await q.download();

        if (!buffer || buffer.length < 10) throw new Error('No se pudo descargar la imagen.');

        // 4. Subir a un hosting temporal (Catbox)
        // La API de Catbox es muy estable para esto
        const uploadUrl = 'https://catbox.moe/user/api.php';
        
        // Catbox prefiere que le mandes el buffer directamente en un form
        const bodyForm = new FormData();
        bodyForm.append('reqtype', 'fileupload');
        bodyForm.append('fileToUpload', buffer, { filename: 'image.jpg' });
        
        const uploadRes = await axios.post(uploadUrl, bodyForm, {
            headers: { ...bodyForm.getHeaders() }
        }).catch(() => null);

        // Verificamos que Catbox nos devuelva una URL válida (empieza con https://)
        const imageUrl = typeof uploadRes?.data === 'string' && uploadRes.data.startsWith('https://') ? uploadRes.data : null;
        
        if (!imageUrl) throw new Error('No se pudo generar la URL temporal de la imagen.');

        // 5. Llamada a la API de Sylphy (HD)
        // Scale 2 es el estándar para duplicar la resolución
        const apiKey = 'sylphy-ty5xtWm';
        const apiUrl = `https://sylphy.xyz/tools/upscale?url=${encodeURIComponent(imageUrl)}&scale=2&api_key=${apiKey}`;
        
        console.log("Generando HD desde URL:", imageUrl); // Depuración

        const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 60000 }); // 60s timeout

        if (!response.data || response.data.length < 100) throw new Error('La API de HD no devolvió una imagen válida.');

        // 6. Enviar el resultado final
        await sock.sendMessage(from, { 
            image: Buffer.from(response.data), 
            caption: '`✅ ¡Imagen mejorada con éxito!`' 
        }, { quoted: m });

    } catch (e) {
        console.error("Error detallado en HD:", e.message);
        await sock.sendMessage(from, { 
            text: `> ❌ Error: No se pudo procesar la imagen.\n> [Detalle: *${e.message}*]` 
        }, { quoted: m });
    }
}
break;
///////////

 case 'imagine': case 'generar': {
    const axios = require('axios');
    const prompt = args.join(' ');

    if (!prompt) return await sock.sendMessage(from, { 
        text: `《✧》 Describe la imagen que quieres crear.\n✐ Ejemplo: .ia una moto MT09 en el espacio` 
    }, { quoted: m });

    await sock.sendMessage(from, { text: '`⏳ Generando imagen... esto puede tardar unos segundos.`' }, { quoted: m });

    try {
        const response = await axios.get(`https://apis-starlights-team.koyeb.app/starlight/txt-to-image2?text=${encodeURIComponent(prompt)}`);
        
        // --- DEPURACIÓN: Esto imprimirá la respuesta real en tu consola ---
        console.log("Respuesta de la API:", JSON.stringify(response.data, null, 2));

        // Buscamos el link en todas las opciones posibles que suelen usar estas APIs
        const imgUrl = response.data.result || response.data.url || response.data.status || response.data.link;

        if (!imgUrl || typeof imgUrl !== 'string') {
            throw new Error('La API no devolvió un link válido.');
        }

        await sock.sendMessage(from, { 
            image: { url: imgUrl }, 
            caption: `✨ *Imagen Generada* ✨\n> ✎ *Prompt:* ${prompt}` 
        }, { quoted: m });

    } catch (e) {
        console.error("Error detallado:", e.message);
        await sock.sendMessage(from, { 
            text: `> ❌ Error: No se pudo generar. Intenta con un texto más corto o en inglés.` 
        }, { quoted: m });
    }
}
break;
//////

case 'ia': case 'llama': case 'chatgpt': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué pasó, pariente? Dime qué quieres preguntarme.' }, { quoted: m });

    try {
        const Groq = require("groq-sdk");
        const groq = new Groq({ apiKey: "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" }); // Usa la nueva que generaste

        // 1. Buscamos al usuario en la DB usando el modelo User que creamos
        let user = await User.findOne({ jid: sender });
        
        // Si no existe, lo creamos de una vez
        if (!user) {
            user = await User.create({ jid: sender, name: m.pushName || 'Usuario', history: [] });
        }

        // 2. Preparamos los mensajes (System + Historial + Pregunta Actual)
        let messages = [
            { 
                role: "system", 
                content: `Eres un bot de WhatsApp divertido y servicial. Hablas como un compa de México (usa jerga como "qué onda", "pariente", "arre"). Eres experto en programación, el juego Free Fire y motos Yamaha MT-09. El usuario con el que hablas se llama ${m.pushName || 'pariente'}.` 
            }
        ];

        // Añadimos el historial que ya teníamos guardado
        if (user.history && user.history.length > 0) {
            user.history.forEach(msg => messages.push(msg));
        }

        // Añadimos la pregunta que acaba de hacer el usuario
        messages.push({ role: "user", content: text });

        // 3. Llamada a la API de Groq (Llama 3.3 70B)
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            stream: false
        });

        const respuestaIA = chatCompletion.choices[0]?.message?.content || "No supe qué decirte, compa.";

        // 4. Actualizamos la memoria en la DB
        // Guardamos este par de mensajes (pregunta y respuesta)
        user.history.push({ role: "user", content: text });
        user.history.push({ role: "assistant", content: respuestaIA });

        // Si el historial es muy largo (más de 10 mensajes), borramos los más viejos
        // Esto ayuda a tus 4GB de RAM y a no gastar tokens de más
        while (user.history.length > 10) {
            user.history.shift();
        }

        // Guardamos los cambios en MongoDB Atlas
        await user.save();

        // 5. Enviamos la respuesta a WhatsApp
        await sock.sendMessage(from, { text: respuestaIA }, { quoted: m });

    } catch (err) {
        console.error("Error en el comando IA:", err);
        await sock.sendMessage(from, { text: '❌ Valio barriga, la IA se trabó. Intenta de nuevo en un rato.' }, { quoted: m });
    }
}
break;

////////
            case 'menu':
                await sock.sendMessage(from, { text: `╭───『 *BOT MAESTRO* 』───╮
│
│ 🧠 *IA & VOZ*
│ ❯ .ai
│ ❯ .v
│ ❯ .cop 
│ ❯ .copilot
│ ❯ .letra 
│ ❯ .lyrics
│ ❯ .gemini
│ ❯ .ia
│ ❯ llama
│
│ 📥 *DESCARGAS*
│ ❯ .audio 
│ ❯ .video 
│ ❯.album
│ ❯ .tt 
│ ❯ .playlist
│ ❯ .ytaudio
│ ❯ .ytvideo
│
│ 🎭 *DIVERSIÓN*
│ ❯ .kiss 
│ ❯ .slap 
│ ❯ .hug
│ ❯ .kill
│ ❯ .nsfwmenu
│ ❯ .translate 
│ ❯ .brat
│
│ 🛡️ *ADMIN*
│ ❯ .tag 
│ ❯ .kick
│ ❯ .add 
│ ❯ .del
│ ❯ .promote 
│ ❯ .demote
│ ❯ .open 
│ ❯ .close
│ ❯ .antilink on/off
│
│ 💰 *ECONOMÍA*
│ ❯ .profile 
│ ❯ .menuperfil
│ ❯ .work 
│ ❯ .rob
│
│ ⚙️ *SISTEMA*
│ ❯ .s
│ ❯ .p
│ ❯ .reload
│
╰───『 *By Charly-Bot* 』───╯` });
                break;

case 'v': case 'ai': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué quieres que diga, pariente?' });
    
    try {
        const axios = require('axios');
        // Llamada a Mistral
        const resIA = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: "open-mistral-7b",
            messages: [
                { role: "system", content: "Eres Bot Maestro . Habla corto, máximo 2 frases, usa modismos mexicanos y sé directo." }, 
                { role: "user", content: text }
            ]
        }, { headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}` } });

        let respuestaTexto = resIA.data.choices[0].message.content;

        if (command === 'ai') {
            await sock.sendMessage(from, { text: respuestaTexto });
        } else {
            // --- LIMPIEZA PARA EL AUDIO ---
            let textoLimpio = respuestaTexto
                .replace(/[*_~]/g, '') 
                .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ,.?¡!¿]/g, '') 
                .slice(0, 200); 

            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textoLimpio)}&tl=es&client=tw-ob`;
            
            // --- EL TRUCO: Descargar el audio primero ---
            const resAudio = await axios({
                method: 'get',
                url: ttsUrl,
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                }
            });

            await sock.sendMessage(from, { 
                audio: Buffer.from(resAudio.data), // Enviamos el audio real, no el link
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m });
        }
    } catch (e) { 
        console.error("Error en IA/Audio:", e.message);
        await sock.sendMessage(from, { text: '❌ Valio queso el audio, intenta de nuevo.' }); 
    }
}
break;


case 'kiss': case 'hug': case 'slap': {
    const axios = require('axios');
    
    // 1. Detectar a quién mencionaste (@)
    let mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    // 2. Detectar a quién le respondes (Quoted)
    let quoted = m.message?.extendedTextMessage?.contextInfo?.participant || 
                 m.message?.imageMessage?.contextInfo?.participant || 
                 m.message?.videoMessage?.contextInfo?.participant;

    // El objetivo es la mención, si no hay, es el mensaje respondido
    const objetivo = mentioned || quoted;

    // Si no hay ni uno ni otro, el bot te avisa y NO se queda trabado
    if (!objetivo) {
        return sock.sendMessage(from, { 
            text: `⚠️ ¡Epa! Etiqueta a alguien o responde a su mensaje para usar .${command}, pariente.` 
        }, { quoted: m });
    }

    try {
        // Pedimos el GIF a la API
        const response = await axios.get(`https://api.waifu.pics/sfw/${command}`);
        const gifUrl = response.data.url;

        const targetName = objetivo.split('@')[0];
        const selfName = sender.split('@')[0];
        
        let frase = '';
        if (command === 'kiss') frase = `👩‍❤️‍💋‍👨 @${selfName} le dio un beso a @${targetName}`;
        if (command === 'hug') frase = `🫂 @${selfName} abrazó a @${targetName}`;
        if (command === 'slap') frase = `🖐️ @${selfName} le arrimó un bofetón a @${targetName}`;

        await sock.sendMessage(from, { 
            video: { url: gifUrl }, 
            caption: frase,
            gifPlayback: true,
            mentions: [sender, objetivo]
        }, { quoted: m });

    } catch (e) {
        console.error(`ERROR EN ${command.toUpperCase()}:`, e);
        await sock.sendMessage(from, { text: '❌ La API anda de floja, intenta de nuevo.' });
    }
}
break;


            // --- DESCARGAS (USANDO TU YT-DLP LOCAL) ---

case 'tt': case 'tiktok': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué buscamos en TikTok? Ejemplo: .tt pvta luna' });

    // Reacción de búsqueda
    await sock.sendMessage(from, { react: { text: "🔍", key: m.key } });
    await sock.sendMessage(from, { text: `🔍 *Buscando los 5 mejores videos de:* _${text}_...` });

    try {
        const axios = require('axios');
        
        const options = {
            method: 'GET',
            url: 'https://tiktok-scraper7.p.rapidapi.com/feed/search',
            params: {
                keywords: text,
                region: 'mx',
                count: '5' 
            },
            headers: {
                'x-rapidapi-key': 'e774e5f65fmsh8a64771078f8baap19a40cjsn79a68c1e252f',
                'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        const listaVideos = response.data.data.videos; 

        if (!listaVideos || listaVideos.length === 0) {
            await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            return sock.sendMessage(from, { text: '❌ No hallé resultados para esa búsqueda.' });
        }

        const top5 = listaVideos.slice(0, 5);
        
        for (let i = 0; i < top5.length; i++) {
            const v = top5[i];
            
            // Adaptamos las variables de tu API al diseño estético
            const title = v.title || 'Sin título';
            const author = v.author?.nickname || v.author?.unique_id || 'Desconocido';
            const duration = v.duration || 'N/A';
            const likes = (v.digg_count || 0).toLocaleString();
            const comments = (v.comment_count || 0).toLocaleString();
            const views = (v.play_count || 0).toLocaleString();
            const shares = (v.share_count || 0).toLocaleString();
            const created_at = v.create_time ? new Date(v.create_time * 1000).toLocaleDateString('es-MX') : 'N/A';
            const videoUrl = v.play; // Link sin marca de agua

            const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload [${i + 1}/5]　ׄᰙ

𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${title}
𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${author}
𖣣ֶㅤ֯⌗ ⴵ  ׄ ⬭ *Duración:* ${duration}s
𖣣ֶㅤ֯⌗ ❖  ׄ ⬭ *Likes:* ${likes}
𖣣ֶㅤ֯⌗ ❀  ׄ ⬭ *Comentarios:* ${comments}
𖣣ֶㅤ֯⬭ ✿  ׄ ⬭ *Vistas:* ${views}
𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Compartidos:* ${shares}
𖣣ֶㅤ֯⌗ ☁︎  ׄ ⬭ *Fecha:* ${created_at}`.trim();

            // Enviamos el video con la nueva caption
            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: caption 
            }, { quoted: m });

            // Pequeña espera para no saturar WhatsApp
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
        await sock.sendMessage(from, { text: '🏁 *Ráfaga completada.* ¡Ahí quedaron los 5, pariente!' });

    } catch (error) {
        console.error("ERROR TIKTOK RÁFAGA:", error);
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(from, { text: '❌ Hubo un error al procesar la ráfaga de videos.' });
    }
}
break;

case 'translate': case 'say': case 'decir': {
    const googleTTS = require('google-tts-api');
    const fs = require('fs');
    const path = require('path');

    if (!text) return sock.sendMessage(from, { text: '¿Qué quieres que diga, pariente? Escribe el mensaje.' });

    try {
        // Generamos la URL del audio (en español de México 'es')
        const audioUrl = googleTTS.getAudioUrl(text, {
            lang: 'es',
            slow: false,
            host: 'https://translate.google.com',
        });

        // Nombre temporal para el archivo
        const fileName = `tts-${Date.now()}.mp3`;
        const filePath = path.join(__dirname, fileName);

        // Descargamos el audio usando axios o fetch (usaremos axios que ya lo tienes)
        const axios = require('axios');
        const response = await axios({
            method: 'get',
            url: audioUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
            // Enviamos como NOTA DE VOZ (PTT: true para que salga con el microfonito azul)
            await sock.sendMessage(from, { 
                audio: { url: filePath }, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m });

            // Borramos el archivo después de 5 segundos para no llenar la compu
            setTimeout(() => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }, 5000);
        });

        writer.on('error', (err) => {
            console.error(err);
            sock.sendMessage(from, { text: '❌ Error al generar el audio.' });
        });

    } catch (e) {
        console.error("ERROR TTS:", e);
        await sock.sendMessage(from, { text: '❌ No pude procesar la voz, compa.' });
    }
}
break;


case 'tag': {
                if (!isAdmin) return;
                
                const meta = await sock.groupMetadata(from);
                const participants = meta.participants.map(p => p.id);
                
                // 1. Buscamos el contenido: 
                // Primero lo que escribiste, si no, lo que dice el mensaje citado
                const content = text || (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                                         m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text);

                if (!content) return sock.sendMessage(from, { text: '《✧》 Escribe algo o responde a un mensaje para taggear a todos.' });

                // 2. Enviamos el mensaje mencionando a todos
                await sock.sendMessage(from, { 
                    text: content, 
                    mentions: participants 
                });
                break;
            }
case 'kick':
            case 'sacar': {
                if (!isAdmin) return;

                // 1. Identificamos a quién vamos a sacar (por mención o citando mensaje)
                const toKick = m.message.extendedTextMessage?.contextInfo?.participant || 
                               (text ? text.replace(/\D/g,'') + '@s.whatsapp.net' : null);

                if (!toKick) return sock.sendMessage(from, { text: '《✧》 Menciona a quién quieres darle cuello o responde a su mensaje.' });

                // 2. EL MENSAJE DE DESPEDIDA (Antes de sacarlo)
                await sock.sendMessage(from, { 
                    text: `@${toKick.split('@')[0]} Te saqué por puta. 👋🔥`, 
                    mentions: [toKick] 
                });

                // 3. SE VA DEL GRUPO
                await sock.groupParticipantsUpdate(from, [toKick], "remove");
                break;
            }

break;
case 'del': case 'delete': {
    // 1. Verificaciones de seguridad (Grupo y Admins)
    const groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
    const participants = isGroup ? groupMetadata.participants : [];
    const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);
    
    // ¿Es admin el que escribe? ¿Es el dueño del bot?

    const isBotAdmin = groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net');
    const isOwner = ['82906290606190@s.whatsapp.net'].includes(sender); // Cambia TU_NUMERO
 // 2. Verificación: ¿El que lo ejecuta tiene permiso?
    if (!isGroup) return sock.sendMessage(from, { text: '❌ Este comando solo funciona en grupos.' });
    if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: '❌ Solo los administradores pueden ejecutar este comando.' });

    // 3. Lógica para identificar el mensaje a borrar
    const quoted = m.message.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) return sock.sendMessage(from, { text: '❌ Responde al mensaje que quieres borrar.' });

    const key = {
        remoteJid: from,
        fromMe: quoted.participant === sock.user.id.split(':')[0] + '@s.whatsapp.net',
        id: quoted.stanzaId,
        participant: quoted.participant
    };

    // 4. Intentar borrar
    try {
        await sock.sendMessage(from, { delete: key });
    } catch (err) {
        await sock.sendMessage(from, { text: '❌ No pude borrar el mensaje. Asegúrate de que yo (el bot) sea administrador, si no, WhatsApp no me deja.' });
    }
}
break;
case 'promote': case 'demote': {
                if (!isGroup || !isAdmin) return;
                let user = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message.extendedTextMessage?.contextInfo?.participant;
                if (!user && text) user = text.replace(/\D/g, '') + '@s.whatsapp.net';
                if (!user) return sock.sendMessage(from, { text: 'Menciona a alguien.' });
                
                const action = command === 'promote' ? 'promote' : 'demote';
                await sock.groupParticipantsUpdate(from, [user], action);
                await sock.sendMessage(from, { text: `✅ Hecho, pariente.` });
                break;
            }

            case 'open': 
    if (!isAdmin) return;
    await sock.groupSettingUpdate(from, 'not_announcement');
    await sock.sendMessage(from, { text: 'Grupo Abierto' });
    break;

case 'close':
    if (!isAdmin) return;
    await sock.groupSettingUpdate(from, 'announcement');
    await sock.sendMessage(from, { text: 'Grupo Cerrado' });
    break;
case 'antilink':
            if (!isGroup) return sock.sendMessage(from, { text: '❌ Este comando solo sirve en grupos, pariente.' });
            if (!isAdmin) return sock.sendMessage(from, { text: '❌ Ocupas ser admin para moverle al Antilink.' });
            
            if (!text || (text !== 'on' && text !== 'off')) {
                return sock.sendMessage(from, { text: '⚠️ Usa: *.antilink on* o *.antilink off*' });
            }

            db.groups[from].antilink = (text === 'on');
            saveDB();

            await sock.sendMessage(from, { 
                text: `🛡️ *Configuración Actualizada*\n\nEl Antilink ahora está: *${text === 'on' ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}*` 
            });
            break;

            // --- ECONOMÍA ---
case 'w': case 'work': case 'chambear': case 'chamba': case 'trabajar': {
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
break;

case 'profile': case 'perfil': {
    // 1. Aseguramos que el usuario exista en la memoria
    if (!db.users[sender]) db.users[sender] = { id: sender };
    const user = db.users[sender];

    // 2. Extraemos los datos (si no existen, ponemos valores por defecto)
    const name = m.pushName || user.name || 'Usuario';
    const birth = user.birth || 'Sin especificar';
    const genero = user.genre || 'Oculto';
    
    // Si quieres que el contador de comandos funcione, hay que sumarle uno aquí
    user.usedcommands = (user.usedcommands || 0) + 1;
    await saveDB(sender); // Guardamos este pequeño cambio en la nube

    const exp = user.exp || 0;
    const nivel = user.level || 1;
    const dinero = user.money || 0;
    const pasatiempo = user.pasatiempo || 'No definido';
    const desc = user.description ? `\n> _${user.description}_` : '';
    
    // 3. Lógica de pareja (Buscamos el nombre del esposo/a en la DB)
    const parejaId = user.marry;
    let parejaNombre = 'Nadie';
    if (parejaId) {
        // Intentamos sacar el nombre si el bot lo tiene registrado, si no, el número
        parejaNombre = db.users[parejaId]?.name || `@${parejaId.split('@')[0]}`;
    }
    
    const estadoCivil = genero === 'Mujer' ? 'Casada con' : genero === 'Hombre' ? 'Casado con' : 'Casadx con';

    // 4. Rango y Progreso
    // Nota: Asegúrate de tener tu función 'calcularProgreso' definida en el index.js
    const { xp, progresoActual, porcentaje } = calcularProgreso(nivel, exp);

    const profileText = `「✿」 *PERFIL DE USUARIO* 「✿」
    
◢ *${name}* ◤${desc}

♛ *Cumpleaños:* ${birth}
⸙ *Pasatiempo:* ${pasatiempo}
⚥ *Género:* ${genero}
♡ *${estadoCivil}:* ${parejaId ? parejaNombre : 'Nadie'}

📊 *ESTADÍSTICAS*
✿ *Nivel:* ${nivel}
❀ *Experiencia:* ${exp.toLocaleString()}
➨ *Progreso:* ${progresoActual} ➔ ${xp} _(${porcentaje}%)_

💰 *Cartera:* $${dinero.toLocaleString()}
❒ *Comandos:* ${user.usedcommands.toLocaleString()}
☁️ _Datos protegidos en MongoDB Atlas_`;

    // 5. Foto de perfil
    let pp = 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg'; // Foto por defecto
    try { 
        pp = await sock.profilePictureUrl(sender, 'image'); 
    } catch {
        // Si no tiene foto o falla, se queda la de por defecto
    }

    await sock.sendMessage(from, { 
        image: { url: pp }, 
        caption: profileText,
        mentions: parejaId ? [parejaId] : [] // Mencionamos a la pareja para que el link funcione
    }, { quoted: m });
}
break;
// --- SETTERS (Para poner datos) ---
// --- CONFIGURAR GÉNERO ---
case 'setgenre': {
    const genresList = ['Hombre', 'Mujer', 'Femboy', 'Transgénero', 'Gay', 'Lesbiana', 'No Binario']; 
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Elige un género:\n${genresList.map((g, i) => `${i+1}. ${g}`).join('\n')}` }, { quoted: m });

    const choice = parseInt(text) - 1;
    const generoSelec = genresList[choice] || text;
    
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].genre = generoSelec; 
    
    await saveDB(sender); // Guarda en MongoDB

    await sock.sendMessage(from, { text: `✎ Género establecido como: *${generoSelec}*` }, { quoted: m });
}
break;

case 'setdesc': case 'setdescription': {
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Debes especificar una descripción.\n✐ Ejemplo: .setdesc Hola, soy fan de Nanatsu!` }, { quoted: m });
    
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].description = text; 
    
    await saveDB(sender);

    await sock.sendMessage(from, { text: `✎ Se ha establecido tu descripción correctamente.` }, { quoted: m });
}
break;

case 'sethobby': case 'setpasatiempo': {
    if (!text) return await sock.sendMessage(from, { text: `《✧》 Escribe tu pasatiempo favorito.` }, { quoted: m });
    
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].pasatiempo = text; 
    
    await saveDB(sender);

    await sock.sendMessage(from, { text: `✐ Se ha establecido tu pasatiempo: *${text}*` }, { quoted: m });
}
break;

case 'setbirth': case 'setcumple': {
    // 1. Verificamos que el usuario haya escrito algo
    if (!text) return await sock.sendMessage(from, { 
        text: `《✧》 Escribe tu fecha de nacimiento.\n\n✐ *Ejemplo:* .setbirth 15 de Octubre` 
    }, { quoted: m });

    // 2. Aseguramos que el usuario exista en la memoria local
    if (!db.users[sender]) db.users[sender] = { id: sender };
    
    // 3. Guardamos la fecha en el objeto local
    db.users[sender].birth = text;

    // 4. ¡A LA NUBE! Guardamos en MongoDB
    try {
        await saveDB(sender);
        
        await sock.sendMessage(from, { 
            text: `🎂 ¡Listo! Tu fecha de nacimiento se ha guardado como: *${text}*\n\n> Ahora aparecerá en tu .perfil para siempre.` 
        }, { quoted: m });
        
    } catch (e) {
        console.error("Error al guardar el cumple en Mongo:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un error al conectar con la base de datos.' }, { quoted: m });
    }
}
break;

// --- DEL (Borrar datos con guardado en nube) ---
case 'deldesc': 
    db.users[sender].description = ''; 
    await saveDB(sender); 
    m.reply('✎ Descripción eliminada.'); 
break;

case 'delgenre': 
    db.users[sender].genre = ''; 
    await saveDB(sender); 
    m.reply('✎ Género eliminado.'); 
break;

case 'delhobby': 
    db.users[sender].pasatiempo = ''; 
    await saveDB(sender); 
    m.reply('✎ Pasatiempo eliminado.'); 
break;

// --- AFK (Estado ausente) ---
case 'afk': {
    if (!db.users[sender]) db.users[sender] = {};
    db.users[sender].afk = Date.now();
    db.users[sender].afkReason = text || 'Sin especificar';
    
    await saveDB(sender); // Muy importante para que no se quite el AFK si el bot se reinicia
    
    m.reply(`ꕥ Estarás AFK.\n> ○ Motivo » *${db.users[sender].afkReason}*`);
}
break;


case 'menuperfil': case 'profilemenu': {
    const menu = `╔════════════════════╗
║    ✨  *MENÚ DE USUARIO* ✨    ║
╚════════════════════╝

  ┌─  *〔 CUENTA 〕*
  │  • .profile
  │  • .afk <motivo>
  └───────────────┈

  ┌─  *〔 EDICIÓN 〕*
  │  • .setdesc  |  .setgenre
  │  • .sethobby |  .setbirth
  │  • .deldesc  |  .delhobby
  └───────────────┈

  ┌─  *〔 INTERACCIÓN 〕*
  │  • .marry   💍
  │  • .divorce 💔
  │  • .lb      🏆
  └───────────────┈`;

    await sock.sendMessage(from, { text: menu }, { quoted: m });
}
break;




            case 'rob':
                const v = m.message.extendedTextMessage?.contextInfo?.participant;
                if (!v) return;
                const r = Math.floor(db.users[v].money * 0.1);
                db.users[v].money -= r; db.users[sender].money += r;
                saveDB();
                await sock.sendMessage(from, { text: `🥷 Robaste $${r}` });
                break;

            // --- SISTEMA ---
        case 's': case 'sticker': {
                const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                
                // Verificamos si es imagen o video (enviada o respondida)
                const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const mime = (m.message.imageMessage || m.message.videoMessage) 
                    ? (m.message.imageMessage ? 'image' : 'video') 
                    : (quoted?.imageMessage ? 'image' : quoted?.videoMessage ? 'video' : null);

                if (!mime) return sock.sendMessage(from, { text: '❌ Responde a una imagen o video, pariente.' });

                await sock.sendMessage(from, { text: '⏳ Cocinando tu sticker...' });

                // Descargamos el media
                const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                const messageType = mime === 'image' 
                    ? (m.message.imageMessage || quoted.imageMessage) 
                    : (m.message.videoMessage || quoted.videoMessage);
                
                const stream = await downloadContentFromMessage(messageType, mime);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // Creamos el sticker
                const sticker = new Sticker(buffer, {
                    pack: 'Bot de Miguel Auza 🚀', // Nombre del paquete
                    author: 'Gemini Bot',           // Autor
                    type: StickerTypes.FULL,        // Tipo de recorte
                    categories: ['🤩', '🎉'],
                    id: '12345',
                    quality: 70,                    // Calidad para que no pese tanto
                });

                const stickerBuffer = await sticker.toBuffer();
                await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
            }
            break;

////////

case 'daily': case 'diario': {
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
    
    // GUARDADO EN MONGODB
    await saveDB(sender); 

    const siguiente = Math.min(20000 + user.streak * 5000, 1015000).toLocaleString();
    let texto = `「 🎁 *RECOMPENSA DIARIA* 🎁 」\n\n`;
    texto += `*+ $${recompensa.toLocaleString()}* agregados a tu cuenta.\n`;
    texto += `🔥 *Racha actual:* ${user.streak} día(s)\n`;
    texto += `💰 *Próximo Daily:* +$${siguiente}\n\n`;
    
    texto += lost ? `> ❗ *Perdiste tu racha anterior por no venir ayer.*` : `> ¡Sigue así para ganar más mañana!`;

    await sock.sendMessage(from, { text: texto }, { quoted: m });
}
break;


case 'marry': case 'casarse': {
    const proposer = sender; 
    // Capturamos a quién mencionas
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    
    if (!mentioned) return await sock.sendMessage(from, { text: '《✧》 Menciona a la persona con la que te quieres casar, pariente.' }, { quoted: m });
    if (proposer === mentioned) return await sock.sendMessage(from, { text: '《✧》 No puedes casarte contigo mismo, no seas gacho.' }, { quoted: m });
    
    // Verificamos que existan en la base de datos global
    if (!global.db.users[proposer]) global.db.users[proposer] = { money: 100, usedcommands: 0 };
    if (!global.db.users[mentioned]) global.db.users[mentioned] = { money: 100, usedcommands: 0 };

    // Revisamos si ya están casados
    if (global.db.users[proposer].marry) return await sock.sendMessage(from, { text: `《✧》 Ya estás casado, no seas infiel.` }, { quoted: m });
    if (global.db.users[mentioned].marry) return await sock.sendMessage(from, { text: `《✧》 Esa persona ya tiene dueño(a).` }, { quoted: m });

    // Guardamos la propuesta en el objeto global que definimos arriba
    global.proposals[mentioned] = proposer;

    await sock.sendMessage(from, { 
        text: `💍 *PROPUESTA DE MATRIMONIO*\n\n@${proposer.split('@')[0]} le ha pedido matrimonio a @${mentioned.split('@')[0]}.\n\n⚘ *Responde con:*\n> ❀ *.acept* para confirmar.\n> ❀ Tienes 2 minutos antes de que expire.`,
        mentions: [proposer, mentioned]
    }, { quoted: m });

    // Tiempo de espera de 2 minutos
    setTimeout(() => { 
        if (global.proposals[mentioned] === proposer) {
            delete global.proposals[mentioned]; 
        }
    }, 120000);
}
break;



case 'divorce': case 'divorciarse': {
    if (!db.users[sender]) db.users[sender] = {};
    const user = db.users[sender];
    const parejaId = user.marry;

    if (!parejaId) return await sock.sendMessage(from, { text: '《✧》 No tienes de quién divorciarte.' }, { quoted: m });

    const exPareja = db.users[parejaId];
    user.marry = ""; 
    if (exPareja) exPareja.marry = ""; 
    
    // GUARDADO EN MONGODB (Ambos usuarios)
    await saveDB(sender); 
    if (parejaId) await saveDB(parejaId); 

    await sock.sendMessage(from, { text: `💔 Te has divorciado legalmente.` }, { quoted: m });
}
break;


case 'acept': case 'aceptar': {
    const proposee = sender; // El que está aceptando (tú)
    const proposer = global.proposals[proposee]; // El que mandó la propuesta

    if (!proposer) return await sock.sendMessage(from, { text: '《✧》 No tienes propuestas de matrimonio pendientes o ya expiró.' }, { quoted: m });

    // 1. Aseguramos que ambos existan en el objeto local db
    if (!db.users[proposer]) db.users[proposer] = { id: proposer, money: 0, marry: '', level: 1 };
    if (!db.users[proposee]) db.users[proposee] = { id: proposee, money: 0, marry: '', level: 1 };

    // 2. Guardamos el vínculo en la RAM (db)
    db.users[proposer].marry = proposee;
    db.users[proposee].marry = proposer;

    // 3. ¡ESTO ES LO NUEVO! Guardamos a ambos en MongoDB Atlas
    try {
        await saveDB(proposer); 
        await saveDB(proposee); 
        
        // Borramos la propuesta de la memoria temporal
        delete global.proposals[proposee]; 

        await sock.sendMessage(from, { 
            text: `✎ ¡Felicidades! @${proposer.split('@')[0]} y @${proposee.split('@')[0]} ahora están casados legalmente. ✨\n\n> Los datos han sido respaldados en la nube.`,
            mentions: [proposer, proposee]
        }, { quoted: m });

    } catch (e) {
        console.error("Error al casar en Mongo:", e);
        await sock.sendMessage(from, { text: '❌ Hubo un error al guardar el matrimonio en la base de datos.' }, { quoted: m });
    }
}
break;

////////
case 'p': case 'ping': {
    const start = Date.now(); // 1. Arranca el cronómetro

    // 2. Enviamos el mensaje primero (esto es lo que tarda tiempo)
    const { key } = await sock.sendMessage(from, { text: '🚀 *Calculando...*' }, { quoted: m });

    const end = Date.now(); // 3. Detiene el cronómetro después de enviar
    const latency = end - start; // 4. Ahora sí hay una diferencia de tiempo

    // 5. Editamos el mensaje anterior con el resultado real
    await sock.sendMessage(from, { 
        text: `✿ *Pong!*\n> Latencia: *${latency}ms`, 
        edit: key 
    }, { quoted: m });
}
break;
            case 'reload': process.exit(); break;
}

 });
} // <--- ESTA ES LA LLAVE QUE TE FALTABA PARA CERRAR startBot

// Función para elegir un trabajo al azar
function pickRandom(list) {
    return list[Math.floor(list.length * Math.random())];
}

// Función para formatear el tiempo de espera
function formatTime(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const parts = [];
    if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);
    return parts.join(' y ');
}

// Lista de trabajos
const trabajosLista = [
  "Trabajas como recolector de fresas y ganas",
  "Eres asistente en un taller de cerámica y obtienes",
  "Diseñas páginas web y ganas",
  "Eres fotógrafo de bodas y recibes",
  "Trabajas en una tienda de mascotas y ganas",
  "Eres narrador de audiolibros y obtienes",
  "Demuestras en el departamento de arte y ganas",
  "Trabajas como jardinero en un parque y recibes",
  "Eres un DJ en fiestas y ganas",
  "Hiciste un mural en una cafetería y te dieron",
  "Trabajas como diseñador de interiores y ganas",
  "Eres un conductor de autobús turístico y obtienes",
  "Preparas sushi en un restaurante y ganas",
  "Trabajas como asistente de investigación y recibes",
  "Eres especialista en marketing de contenidos y ganas",
  "Trabajas en una granja orgánica y obtienes",
  "Eres un bailarín en un espectáculo y ganas",
  "Organizas ferias de arte y recibes",
  "Eres un escritor freelance y ganas",
  "Hiciste un diseño gráfico para una campaña y te pagaron",
  "Trabajas como mecánico de automóviles y ganas",
  "Eres un instructor de surf y recibes",
  "Limpias casas como servicio de limpieza y ganas",
  "Eres un técnico de sonido en conciertos y obtienes",
  "Trabajas como desarrollador de aplicaciones y ganas",
  "Eres un croupier en un casino y recibes",
  "Trabajas como estilista de cabello y ganas",
  "Eres un restaurador de arte y obtienes",
  "Trabajas en una librería y ganas",
  "Eres un guía de montañismo y recibes",
  "Llevas un blog de viajes y ganas",
  "Hiciste una campaña de crowdfunding y obtuviste",
  "Trabajas como asistente social y ganas",
  "Eres un conductor de camión de carga y recibes",
  "Trabajas en un equipo de rescate y ganas",
  "Eres un consultor de negocios y obtienes",
  "Realizas catas de vino y ganas",
  "Trabajas como barista en una cafetería y recibes",
  "Eres un entrenador de mascotas y ganas",
  "Hiciste un documental para una ONG y recibiste",
  "Eres un operador de drones y ganas",
  "Trabajas en una productora de cine y obtienes",
  "Eres un investigador de mercados y ganas",
  "Trabajas como repartidor de comida y recibes",
  "Eres un acupunturista y ganas",
  "Hiciste un diseño de joyas y obtuviste",
  "Trabajas como especialista en atención al cliente y ganas",
  "Eres un conservador de museos y recibes",
  "Trabajas en un centro de rehabilitación y obtienes",
  "Eres un piloto de helicóptero y ganas",
  "Hiciste una campaña de concienciación y te dieron",
  "Trabajas en un taller de mecánica y ganas",
  "Eres un organizador de eventos deportivos y recibes",
  "Desarrollas una aplicación educativa y ganas",
  "Eres un técnico en redes informáticas y obtienes",
  "Trabajas como asistente de producción en teatro y ganas",
  "Eres un ilustrador de libros para niños y recibes",
  "Trabajas en un centro de yoga y obtienes",
  "Eres un chef personal y ganas",
  "Realizas un calendario de fotos y recibiste",
  "Eres un promotor de salud y bienestar y ganas",
  "Trabajas como decorador de interiores y recibes",
  "Eres un arreglista floral y ganas",
  "Organizas un festival de música y obtienes",
  "Eres un periodista de investigación y ganas",
  "Trabajas como asistente técnico en un estudio de grabación y recibes",
  "Eres un mecánico de bicicletas y ganas",
  "Hiciste un video viral y obtuviste",
  "Trabajas como investigador de ciencias sociales y ganas",
  "Eres un organizador de conferencias y recibes",
  "Dibujas caricaturas en eventos y ganas",
  "Eres un responsable de relaciones públicas y obtienes",
  "Trabajas como coach de vida y ganas",
  "Eres un educador en un centro cultural y recibes",
  "Eres un director de fotografía y ganas",
  "Trabajas en un refugio de animales y obtienes",
  "Eres un guía en almuerzos y cenas temáticas y ganas",
  "Hiciste un proyecto de arte comunitario y recibiste",
  "Eres un traductor de documentos y obtienes",
  "Trabajas como asistente personal de un ejecutivo y ganas",
  "Eres un especialista en sostenibilidad y recibes",
  "Realizas un programa de radio y ganas",
  "Trabajas como tasador de arte y obtienes",
  "Eres un creador de contenido en redes sociales y ganas",
  "Hiciste un workshop de manualidades y recibiste"
];

////////

function formatRemainingTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const seg = s % 60;
    const partes = [];
    if (h > 0) partes.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
    if (m > 0) partes.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
    if (seg > 0 || partes.length === 0) partes.push(`${seg} ${seg === 1 ? 'segundo' : 'segundos'}`);
    return partes.join(' y ');
}

////////

function calcularProgreso(level, exp) {
    const growth = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75;
    const min = level === 0 ? 0 : Math.round(Math.pow(level, growth) * 2) + 1;
    const max = Math.round(Math.pow(level + 1, growth) * 2);
    const xpNecesaria = max - min;
    const progresoActual = exp - min;
    const porcentaje = Math.floor((progresoActual / xpNecesaria) * 100);
    return { xp: xpNecesaria, progresoActual, porcentaje };
}

///////

startBot()