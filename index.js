const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Esto crea una mini página web que Koyeb revisa para saber que el bot está vivo
app.get('/', (req, res) => {
    res.send('✅ El Bot de Spotify está Activo y Firme, pariente.');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Keep-Alive corriendo en el puerto ${PORT}`);
});

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
// ✅ PRIMERO IMPORTAS LA LIBRERÍA
const YTDlpWrap = require('yt-dlp-wrap').default; 
// ✅ LUEGO CREAS LA INSTANCIA USANDO LA RUTA DEL DOCKERFILE
const ytDlpWrap = new YTDlpWrap('/usr/local/bin/yt-dlp');
const fetch = require('node-fetch');
const { getTracks } = require('spotify-url-info')(fetch);
// --- AQUÍ ESTÁ EL DE QR TERMINAL ---
const qrcode = require('qrcode-terminal');




// --- CHEQUEO DE HERRAMIENTAS ---
const { exec } = require('child_process');




// --- CONFIGURACIÓN PARA RAILWAY (LINUX) ---
const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;



const MISTRAL_API_KEY = "asWpVr2HF48yiroZFviOGKVV0gAh0JCQ";
const SYLPHY_KEY = "sylphy-ty5xtWm";
const STELLAR_KEY = "api-qG4nw";
const DB_PATH = './database.json';
// Función para cargar DB con seguridad
const loadDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, groups: {} }));
    }
    try {
        let data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        // Si por algo el archivo existe pero está vacío, lo reseteamos
        if (!data.users) data.users = {};
        if (!data.groups) data.groups = {};
        return data;
    } catch (e) {
        return { users: {}, groups: {} };
    }
};

let db = loadDB();
const saveDB = () => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));




// ✅ AQUÍ VA LA FUNCIÓN (Fuera de todo para que sea global)
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

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ["Bot Maestro", "Chrome", "1.0.0"]
    });

    // Guardar la sesión automáticamente
    sock.ev.on('creds.update', saveCreds);

    // Manejo de conexión y QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📸 ¡ESCANEA ESTE QR CON TU WHATSAPP!');
            qrcode.generate(qr, { small: true }); 
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;

            // 🚩 LA MEDICINA: Si hay otra sesión abierta, matamos este proceso
            if (statusCode === DisconnectReason.connectionReplaced) {
                console.log("🚫 CONFLICTO: Sesión duplicada. Cerrando proceso viejo...");
                process.exit(); 
            }

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Conexión cerrada, reintentando:', shouldReconnect);
            
            // Reintento con un pequeño delay para que no se atropelle
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

        // Inicializar Base de Datos
        if (!db.users[sender]) db.users[sender] = { money: 100 };
        if (isGroup && !db.groups[from]) db.groups[from] = { antilink: false };

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
            case 'menu':
                await sock.sendMessage(from, { text: `╭───『 *BOT MAESTRO* 』───╮
│
│ 🧠 *IA & VOZ*
│ ❯ .ai
│ ❯ .v
│ ❯ .cop / .copilot
│ ❯ .letra / .lyrics
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
│ ❯ .fuck
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
            if (!m.message.extendedTextMessage?.contextInfo?.stanzaId) return sock.sendMessage(from, { text: '❌ Responde al mensaje que quieres borrar.' });

            const key = {
                remoteJid: from,
                fromMe: m.message.extendedTextMessage.contextInfo.participant === sock.user.id.split(':')[0] + '@s.whatsapp.net',
                id: m.message.extendedTextMessage.contextInfo.stanzaId,
                participant: m.message.extendedTextMessage.contextInfo.participant
            };

            await sock.sendMessage(from, { delete: key });
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
            case 'work':
                const gana = Math.floor(Math.random() * 500);
                db.users[sender].money += gana;
                saveDB();
                await sock.sendMessage(from, { text: `🛠️ Ganaste $${gana}` });
                break;
            case 'profile':
                await sock.sendMessage(from, { text: `💰 Carteras: $${db.users[sender].money}` });
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
            case 'p': {
                const inicio = Date.now();
                await sock.sendMessage(from, { text: '⭐ Pong...' }, { quoted: m });
                const fin = Date.now();
                const latencia = fin - inicio;

                await sock.sendMessage(from, { 
                    text: ` ✰Pong: ${latencia}ms` 
                }, { quoted: m });
            }
            break;
            case 'reload': process.exit(); break;
}

 });
} // <--- ESTA ES LA LLAVE QUE TE FALTABA PARA CERRAR startBot

startBot()