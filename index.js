const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion 
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ytDlpWrap = new YTDlpWrap(); // Esto busca el binario automáticamente
const fetch = require('node-fetch');
const { getTracks } = require('spotify-url-info')(fetch);

// --- CONFIGURACIÓN DE RUTAS Y LLAVES ---
// Detecta si es Windows (.exe) o Linux (servidor)
const isWindows = process.platform === 'win32';
const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const MISTRAL_KEY = "asWpVr2HF48yiroZFviOGKVV0gAh0JCQ"; 
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


async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"], // Importante para que acepte el código
        printQRInTerminal: false, // Apagamos el QR para que no estorbe
    });

    // --- LÓGICA DEL CÓDIGO DE 8 DÍGITOS ---
    if (!sock.authState.creds.registered) {
        // PON TU NÚMERO AQUÍ con código de país (Ej: 52433...) 
        // O déjalo así para que lo pidas por consola
        const phoneNumber = "526711084329"; // <--- Pon tu número con el 521 o 52
        
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            console.log('-------------------------------------------');
            console.log(`🔥 TU CÓDIGO DE VINCULACIÓN ES: ${code} 🔥`);
            console.log('-------------------------------------------');
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== 401;
            if (shouldReconnect) setTimeout(() => startBot(), 5000);
        } else if (connection === 'open') {
            console.log('✅ BOT MAESTRO ONLINE - Vinculado por código');
        }
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


       switch (command) {

case 'audio': case 'mp3': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué rola buscamos, pariente?' });
    await sock.sendMessage(from, { text: '⏳ Buscando y procesando audio...' });

    try {
        const finalQuery = text.startsWith('http') ? text : `ytsearch1:${text}`;
        // Obtenemos metadatos sin exec
        const metadata = await ytDlpWrap.getVideoInfo([finalQuery, '--no-check-certificate']);
        
        const vTitle = metadata.title || 'Audio';
        const vId = metadata.id;
        const safeTitle = vTitle.replace(/[\\/:*?"<>|]/g, "").substring(0, 40) || 'audio';
        const outPath = path.join(__dirname, `${Date.now()}.mp3`);
        const thumbUrl = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

        await sock.sendMessage(from, { 
            image: { url: thumbUrl }, 
            caption: `✅ *Encontrado*\n📌 *Título:* ${vTitle}\n⏳ _Descargando..._`
        });

        // Descarga directa usando la librería
        await ytDlpWrap.execPromise([
            `https://www.youtube.com/watch?v=${vId}`,
            '--no-check-certificate',
            '-x',
            '--audio-format', 'mp3',
            '-o', outPath
        ]);

        if (fs.existsSync(outPath)) {
            await sock.sendMessage(from, { 
                audio: { url: outPath }, 
                mimetype: 'audio/mp4', 
                fileName: `${safeTitle}.mp3`,
                caption: `🎵 *${vTitle}*`
            }, { quoted: m });
            
            setTimeout(() => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, 30000);
        }
    } catch (e) {
        console.error("ERROR AUDIO:", e);
        await sock.sendMessage(from, { text: '❌ No pude bajar la rola, pariente.' });
    }
}
break;

case 'video': case 'mp4': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué video buscamos, pariente?' });
    await sock.sendMessage(from, { text: '🎥 *Bajando video...*' });

    try {
        const finalQuery = text.startsWith('http') ? text : `ytsearch1:${text}`;
        const metadata = await ytDlpWrap.getVideoInfo([finalQuery, '--no-check-certificate']);
        
        const vTitle = metadata.title || 'Video';
        const vId = metadata.id;
        const safeTitle = vTitle.replace(/[\\/:*?"<>|]/g, "").substring(0, 30);
        const outPath = path.join(__dirname, `${Date.now()}.mp4`);

        // Descarga optimizada para móvil (MP4 480p)
        await ytDlpWrap.execPromise([
            `https://www.youtube.com/watch?v=${vId}`,
            '--no-check-certificate',
            '-f', 'mp4[height<=480]/best[height<=480][ext=mp4]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4',
            '-o', outPath
        ]);

        if (fs.existsSync(outPath)) {
            const stats = fs.statSync(outPath);
            if (stats.size / (1024 * 1024) > 50) {
                fs.unlinkSync(outPath);
                return sock.sendMessage(from, { text: '⚠️ El video pesa más de 50MB. Intenta con uno más corto.' });
            }

            await sock.sendMessage(from, { 
                video: { url: outPath }, 
                caption: `✅ *${vTitle}*\n\n¡Listo tu video!`,
                mimetype: 'video/mp4',
                fileName: `${safeTitle}.mp4`
            }, { quoted: m });

            setTimeout(() => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, 15000);
        }
    } catch (e) {
        console.error("ERROR VIDEO:", e);
        await sock.sendMessage(from, { text: '❌ Error al procesar el video.' });
    }
}
break;
// --- CASO PLAYLIST (SPOTIFY) ---
case 'playlist': {
    if (!text.includes('spotify.com')) return sock.sendMessage(from, { text: 'Pasa un link de Spotify real, pariente.' });
    
    await sock.sendMessage(from, { text: '🎧 *Extrayendo datos de Spotify...* Aguanta.' });

    try {
        const tracks = await getTracks(text);
        if (!tracks || tracks.length === 0) return sock.sendMessage(from, { text: '❌ No encontré rolas en esa playlist.' });

        const listaCorta = tracks.slice(0, 12); // Máximo 12 para no saturar
        await sock.sendMessage(from, { text: `🎶 Encontré *${listaCorta.length}* temas. Buscando en YouTube...` });

        for (let track of listaCorta) {
            try {
                if (!track || !track.name) continue;

                const artista = (track.artists && track.artists[0]) ? track.artists[0].name : '';
                const nombreBusqueda = `${track.name} ${artista}`.trim();
                const safeTitle = track.name.replace(/[\\/:*?"<>|]/g, "").substring(0, 40);
                const outPath = path.join(__dirname, `${Date.now()}_${safeTitle}.mp3`);
                
                // Descarga usando ytDlpWrap sin exec
                await ytDlpWrap.execPromise([
                    `ytsearch1:${nombreBusqueda}`,
                    '--no-check-certificate',
                    '--match-filter', 'duration <= 600',
                    '-x',
                    '--audio-format', 'mp3',
                    '-o', outPath
                ]);

                if (fs.existsSync(outPath)) {
                    await sock.sendMessage(from, { 
                        audio: { url: outPath }, 
                        mimetype: 'audio/mpeg', 
                        fileName: `${safeTitle}.mp3` 
                    });
                    
                    setTimeout(() => { if (fs.existsSync(outPath)) try { fs.unlinkSync(outPath); } catch(e){} }, 15000);
                }
            } catch (innerError) {
                console.error("Error en rola individual:", innerError);
                continue; 
            }
        }
        await sock.sendMessage(from, { text: '✅ *¡Playlist de Spotify terminada!* 😎' });

    } catch (e) {
        console.error("ERROR CRÍTICO SPOTIFY:", e);
        await sock.sendMessage(from, { text: '❌ Error al leer la playlist. Asegúrate de que sea pública.' });
    }
}
break;

case 'album': {
    if (!text) return sock.sendMessage(from, { text: '¿Qué álbum buscamos? Pasa el nombre.' });

    await sock.sendMessage(from, { text: `💿 *Buscando las mejores rolas de:* _${text}_\n⏳ _Filtro: Máximo 10 min por canción._` });

    try {
        // Obtenemos lista de videos (máximo 12) usando la librería
        const metadata = await ytDlpWrap.getVideoInfo([
            `ytsearch12:${text}`,
            '--no-check-certificate',
            '--flat-playlist',
            '--print', '%(title)s|%(id)s|%(duration)s'
        ]);

        // yt-dlp-wrap a veces devuelve un string largo si usas --print
        // Si metadata es un objeto de info, lo manejamos, si no, usamos el resultado directo
        // Para simplificar en álbumes de búsqueda, es mejor iterar la búsqueda:
        
        await sock.sendMessage(from, { text: `🎶 Procesando canciones encontradas...` });

        for (let i = 1; i <= 12; i++) {
            try {
                const outPath = path.join(__dirname, `${Date.now()}_album_${i}.mp3`);
                
                await ytDlpWrap.execPromise([
                    `ytsearch${i}:${text}`, // Busca la posición i
                    '--no-check-certificate',
                    '--match-filter', 'duration <= 600',
                    '-x',
                    '--audio-format', 'mp3',
                    '-o', outPath
                ]);

                if (fs.existsSync(outPath)) {
                    await sock.sendMessage(from, { 
                        audio: { url: outPath }, 
                        mimetype: 'audio/mpeg', 
                        fileName: `track_${i}.mp3` 
                    });
                    setTimeout(() => { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); }, 15000);
                }
            } catch (err) { continue; }
        }
        await sock.sendMessage(from, { text: '✅ *¡Búsqueda de álbum completada!*' });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: '❌ Error en el proceso del álbum.' });
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
                caption: `🖕 *${emisor}* mandó a volar a ${textoMencion}!`,
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

case 'ytaudio':
case 'mp3': {
    const axios = require('axios');
    const yts = require('yt-search');

    const query = args.join(' ');
    if (!query) return sock.sendMessage(from, { text: '⚠️ ¡Epa! Escribe el nombre o pega el link, pariente.' }, { quoted: m });

    try {
        let videoUrl = '';
        let videoTitle = '';

        // 1. BUSCAR EN YOUTUBE
        if (query.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
            videoUrl = query;
            videoTitle = 'Audio de YouTube';
        } else {
            const search = await yts(query);
            if (!search || !search.videos.length) return sock.sendMessage(from, { text: '❌ No encontré esa rola.' });
            videoUrl = search.videos[0].url;
            videoTitle = search.videos[0].title;
            await sock.sendMessage(from, { text: ` *${videoTitle}*\n⏳ Bajando audio` }, { quoted: m });
        }

        // 2. LLAMADA A LA API (Con tu URL de Sylphy)
        const apiKey = 'sylphy-ty5xtWm';
        const apiUrl = `https://sylphy.xyz/download/ytmp3?url=${encodeURIComponent(videoUrl)}&api_key=${apiKey}`;

        const res = await axios.get(apiUrl);

        // --- LA LLAVE MAESTRA: Buscamos específicamente en result.dl_url ---
        const downloadUrl = res.data.result?.dl_url;

        if (!downloadUrl) {
            console.log('--- ERROR DE ESTRUCTURA ---', res.data);
            return sock.sendMessage(from, { text: '❌ La API cambió la jugada. No encontré el link de descarga.' });
        }

        // 3. ENVIAR EL AUDIO
        await sock.sendMessage(from, { 
            audio: { url: downloadUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${videoTitle}.mp3`
        }, { quoted: m });

        console.log(`[✅] Audio enviado: ${videoTitle}`);

    } catch (e) {
        console.error("ERROR EN YTAUDIO:", e.message);
        await sock.sendMessage(from, { text: '❌ Valio queso, intenta de nuevo.' });
    }
}
break;
//////////

case 'ytvideo': {
    // 1. Extraemos el texto de forma segura
    const msgText = text ? text.trim() : "";
    if (!msgText) return await sock.sendMessage(from, { text: '❌ Pega un link de YouTube o escribe el nombre del video.' }, { quoted: m });

    const apiKey = 'sylphy-ty5xtWm';

    try {
        console.log(`\n[🎬] --- INICIANDO PROCESO DE VIDEO ---`);
        let urlYt = "";

        // EXPRESIÓN REGULAR PARA DETECTAR YOUTUBE
        const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = msgText.match(ytRegex);

        if (match) {
            urlYt = `https://www.youtube.com/watch?v=${match[1]}`;
            console.log(`[🔗] URL Limpia Detectada: ${urlYt}`);
        } else {
            console.log(`[🔎] Buscando por nombre: ${msgText}`);
            await sock.sendMessage(from, { text: `🔍 Buscando video: *${msgText}*...` }, { quoted: m });
            
            const searchRes = await axios.get(`https://sylphy.xyz/search/yts?text=${encodeURIComponent(msgText)}&api_key=${apiKey}`);
            const videos = searchRes.data.result || searchRes.data.data || (Array.isArray(searchRes.data) ? searchRes.data : []);
            
            if (!videos || videos.length === 0) {
                return await sock.sendMessage(from, { text: '❌ No encontré resultados para ese nombre.' }, { quoted: m });
            }
            
            urlYt = videos[0].url || videos[0].link;
            console.log(`[✅] Video Encontrado: ${videos[0].title}`);
        }

        // 2. LLAMADA A LA API V2 (Una sola vez)
        console.log(`[⏳] Pidiendo link de descarga a la API...`);
        const downloadUrl = `https://sylphy.xyz/download/v2/ytmp4?url=${encodeURIComponent(urlYt)}&api_key=${apiKey}`;
        const resDownload = await axios.get(downloadUrl);
        const res = resDownload.data;

        // 3. EXTRAER EL LINK DIRECTO
        let finalUrl = res.result?.dl_url || res.result?.url || res.result;
        if (typeof finalUrl === 'object' && finalUrl !== null) {
            finalUrl = finalUrl.dl_url || finalUrl.url;
        }

        if (!finalUrl || !String(finalUrl).startsWith('http')) {
            console.log(`[🔥] ERROR: Link inválido.`, res);
            return await sock.sendMessage(from, { text: '❌ Error: El servidor no pudo generar el link de descarga.' }, { quoted: m });
        }

        // 4. ENVÍO "VIRTUAL" (WhatsApp descarga el video, no tu internet)
        console.log(`[🚀] Pasándole el link a WhatsApp: ${finalUrl}`);
        
        await sock.sendMessage(from, { 
            video: { url: finalUrl }, 
            caption: `✅ *Video listo:* ${res.result?.title || 'YouTube Video'}\n🚀 _Enviado modo ultra rápido (Server-Side)_`,
            mimetype: 'video/mp4',
            fileName: `video.mp4`
        }, { quoted: m });

        console.log(`[✨] Proceso terminado con éxito.`);

    } catch (e) {
        console.error("ERROR EN YTVIDEO:", e.message);
        await sock.sendMessage(from, { text: '❌ Hubo un fallo en la conexión con el servidor de descarga.' }, { quoted: m });
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



/////////



/////////



/////////



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

case 'v': case 'ai':
                if (!text) return sock.sendMessage(from, { text: '¿Qué quieres que diga?' });
                try {
                    const resIA = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                        model: "open-mistral-7b",
                        messages: [
                            { role: "system", content: "Eres Bot Maestro de Zacatecas. Habla corto, máximo 2 frases, usa modismos mexicanos y sé directo." }, 
                            { role: "user", content: text }
                        ]
                    }, { headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}` } });

                    let respuestaTexto = resIA.data.choices[0].message.content;

                    if (command === 'ai') {
                        await sock.sendMessage(from, { text: respuestaTexto });
                    } else {
                        // --- LIMPIEZA PARA EL AUDIO ---
                        // Quitamos emojis, asteriscos y cosas que rompen el link de Google
                        let textoLimpio = respuestaTexto
                            .replace(/[*_~]/g, '') // Quita formato de texto
                            .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ,.?¡!¿]/g, '') // Quita emojis y símbolos raros
                            .slice(0, 200); // Cortamos a 200 caracteres para que no falle

                        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textoLimpio)}&tl=es&client=tw-ob`;
                        
                        await sock.sendMessage(from, { 
                            audio: { url: ttsUrl }, 
                            mimetype: 'audio/mp4', 
                            ptt: true 
                        }, { quoted: m });
                    }
                } catch (e) { 
                    console.error("Error en IA/Audio:", e.message);
                    await sock.sendMessage(from, { text: '❌ No pude procesar el audio, intenta con un texto más corto.' }); 
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

    await sock.sendMessage(from, { text: `🔍 *Buscando los 5 mejores videos de:* _${text}_...` });

    try {
        const axios = require('axios');
        
        const options = {
            method: 'GET',
            url: 'https://tiktok-scraper7.p.rapidapi.com/feed/search',
            params: {
                keywords: text,
                region: 'mx',
                count: '5' // Pedimos 5 resultados a la API
            },
            headers: {
                'x-rapidapi-key': 'e774e5f65fmsh8a64771078f8baap19a40cjsn79a68c1e252f',
                'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        const listaVideos = response.data.data.videos; 

        if (!listaVideos || listaVideos.length === 0) {
            return sock.sendMessage(from, { text: '❌ No hallé resultados para esa búsqueda.' });
        }

        // Limitamos a 5 por si la API manda más
        const top5 = listaVideos.slice(0, 5);
        await sock.sendMessage(from, { text: `✅ ¡Encontrados! Mandando ${top5.length} videos sin marca de agua...` });

        for (let i = 0; i < top5.length; i++) {
            const videoData = top5[i];
            const videoUrl = videoData.play; 
            const title = videoData.title || 'TikTok Video';
            const author = videoData.author?.nickname || 'Usuario';

            // Enviamos el video
            await sock.sendMessage(from, { 
                video: { url: videoUrl }, 
                caption: `🎥 *Video ${i + 1}/5*\n📝 ${title}\n👤 *Autor:* ${author}` 
            }, { quoted: m });

            // ESPERA DE SEGURIDAD: 2 segundos entre videos para evitar baneos
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        await sock.sendMessage(from, { text: '🏁 *Ráfaga completada.* ¡Ahí quedaron, compa!' });

    } catch (error) {
        console.error("ERROR TIKTOK RÁFAGA:", error);
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


            // --- ADMIN ---
            case 'tag':
                if (!isAdmin) return;
                const meta = await sock.groupMetadata(from);
                await sock.sendMessage(from, { text: `${text}`, mentions: meta.participants.map(p => p.id) });
                break;
            case 'kick':
                if (!isAdmin) return;
                const toKick = m.message.extendedTextMessage?.contextInfo?.participant || text.replace(/\D/g,'') + '@s.whatsapp.net';
                await sock.groupParticipantsUpdate(from, [toKick], "remove");
                break;
case 'add': {
    const axios = require('axios');
    
    // 1. Limpiamos el número (del texto, o de a quién le respondes)
    let num = text ? text.replace(/[^0-9]/g, '') : (m.message?.extendedTextMessage?.contextInfo?.participant?.split('@')[0]);

    if (!num) return sock.sendMessage(from, { text: '⚠️ Indica el número, compa. Ejemplo: .add 521234567890' });

    const jid = num + '@s.whatsapp.net';

    try {
        // 2. LE AVENTAMOS LA PETICIÓN DIRECTO A WHATSAPP
        // No preguntamos si somos admin, que WhatsApp nos diga la verdad
        const response = await sock.groupParticipantsUpdate(from, [jid], 'add');

        // 3. Revisamos qué nos dijo WhatsApp
        const status = response[0].status;

        if (status === "200") {
            return sock.sendMessage(from, { text: `✅ ¡A la saca! @${num} ya está adentro.`, mentions: [jid] });
        } else if (status === "403") {
            return sock.sendMessage(from, { text: '⚠️ Ese compa tiene su privacidad de "Nadie me agregue". Mándale el link.' });
        } else if (status === "408") {
            return sock.sendMessage(from, { text: '❌ El número no existe o es inválido.' });
        } else if (status === "409") {
            return sock.sendMessage(from, { text: '✅ Esa persona ya está en el grupo, pariente.' });
        } else {
            return sock.sendMessage(from, { text: `⚠️ WhatsApp no me dejó. Código: ${status}. (Posiblemente no soy admin).` });
        }

    } catch (err) {
        // Esto filtra el error de "bad-request" para que no crashee ni ensucie la consola
        if (err.hasOwnProperty('output') && err.output.statusCode === 500) {
            return sock.sendMessage(from, { 
                text: '❌ *Error de Permisos:* WhatsApp rechazó la solicitud. \n\nProbablemente no soy Admin o mi sesión está desactualizada, pariente.' 
            });
        }
        
        console.log("AVISO: Error controlado al agregar (400 Bad Request)");
        await sock.sendMessage(from, { text: '❌ No pude agregar al usuario. Intenta dándome admin de nuevo.' });
    }
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