import fs from 'fs';
import path from 'path';
import { resolveLidToRealJid } from "../core/utils.js";
import { User } from "../../index.js";

// Ruta a la carpeta data dentro de la raíz de "bot de yutu"
const nsfwPath = path.join(process.cwd(), 'data', 'nsfw.json');

const captions = {      
  anal: (from, to) => `se la metió en el ano a ${to}`,
  cum: (from, to) => `se vino dentro de ${to}`,
  undress: (from, to) => `le está quitando la ropa a ${to}`,
  fuck: (from, to) => `se está cogiendo a ${to}`,
  spank: (from, to) => `le está dando una nalgada a ${to}`,
  lickpussy: (from, to) => `le está lamiendo el coño a ${to}`,
  fap: (from, to) => `se está masturbando pensando en ${to}`,
  grope: (from, to) => `se lo está manoseando a ${to}`,
  sixnine: (from, to) => `está haciendo un 69 con ${to}`,
  suckboobs: (from, to) => `le está chupando las tetas a ${to}`,
  grabboobs: (from, to) => `le está agarrando las tetas a ${to}`,
  blowjob: (from, to) => `le dio una mamada a ${to}`,
  boobjob: (from, to) => `le está haciendo una rusa a ${to}`,
  footjob: (from, to) => `le está haciendo una paja con los pies a ${to}`,
  yuri: (from, to) => `hizo tijeras con ${to}`,
  cummoth: (from, to) => `está llenando la boca de ${to}`, 
  cumshot: (from, to) => `le dio un regalo sorpresa a ${to}`,
  handjob: (from, to) => `le está haciendo una paja a ${to}`,
  lickass: (from, to) => `le está lamiendo el culo a ${to}`,
  lickdick: (from, to) => `se la mete todo en la boca para ${to}`,
  fingering: (from, to) => `le está metiendo los dedos a ${to}`,
  creampie: (from, to) => `terminó dentro de ${to}`,
  facesitting: (from, to) => `se sentó en la cara de ${to}`,
  deepthroat: (from, to) => `le está haciendo una garganta profunda a ${to}`,
  thighjob: (from, to) => `le está haciendo una entre piernas a ${to}`,
  bondage: (from, to) => `ató bien amarrado a ${to}`,
  pegging: (from, to) => `le está dando por detrás a ${to}`,
  futanari: (from, to) => `le demostró lo que tiene a ${to}`,
  yaoi: (from, to) => `se lo pasó genial con ${to}`,
  bukkake: (from, to) => `invitó a sus amigos a acabar encima de ${to}`,
  orgy: (from, to) => `organizó una orgía con ${to}`,
  squirting: (from, to) => `la llevó al límite hasta que se vino con todo a ${to}`
};

const symbols = ['(⁠◠⁠‿⁠◕⁠)', '˃͈◡˂͈', '૮(˶ᵔᵕᵔ˶)ა', '(づ｡◕‿‿◕｡)づ', '(✿◡‿◡)', '(꒪⌓꒪)', '(✿✪‿✪｡)', '(*≧ω≦)', '(✧ω◕)', '˃ 𖥦 ˂', '(⌒‿⌒)', '(¬‿¬)', '(✧ω✧)', '✿(◕ ‿◕)✿', 'ʕ•́ᴥ•̀ʔっ', '(ㅇㅅㅇ❀)', '(∩︵∩)', '(✪ω✪)', '(✯◕‿◕✯)'];

const alias = {
    anal: ['anal','violar'], cum: ['cum'], undress: ['undress','encuerar'], fuck: ['fuck','coger'], 
    spank: ['spank','nalgada'], lickpussy: ['lickpussy'], fap: ['fap','paja'], grope: ['grope'], 
    sixnine: ['sixnine','69'], suckboobs: ['suckboobs'], grabboobs: ['grabboobs'], blowjob: ['blowjob','mamada','bj'], 
    boobjob: ['boobjob'], yuri: ['yuri','tijeras'], footjob: ['footjob'], cummoth: ['cummouth','cummoth'], 
    cumshot: ['cumshot'], handjob: ['handjob'], lickass: ['lickass'], lickdick: ['lickdick'], 
    fingering: ['fingering'], creampie: ['creampie'], facesitting: ['facesitting'], deepthroat: ['deepthroat'], 
    thighjob: ['thighjob'], bondage: ['bondage'], pegging: ['pegging'], futanari: ['futanari', 'futa'], 
    yaoi: ['yaoi'], bukkake: ['bukkake'], orgy: ['orgy', 'orgia'], squirting: ['squirt', 'squirting']
};

export default {
  name: 'nsfw_interact',
  aliases: ['anal','violar','cum','undress','encuerar','fuck','coger','spank','nalgada','lickpussy','fap','paja','grope','sixnine','69','suckboobs','grabboobs','blowjob','mamada','bj','boobjob','yuri','tijeras','footjob','cummoth','cummouth','cumshot','handjob','lickass','lickdick','fingering','creampie','facesitting','deepthroat','thighjob','bondage','pegging','futanari','futa','yaoi','bukkake','orgy','orgia','squirt','squirting'],
  run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {

    const commandUsed = m.body.split(' ')[0].slice(1).toLowerCase();
    const currentCommand = Object.keys(alias).find(key => alias[key].includes(commandUsed)) || commandUsed;

    try {
        let targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || (quoted ? quoted.sender : null);
        let targetName = "";
        let mentions = [m.sender];

        // Nombre del emisor desde MongoDB
        const senderData = await User.findOne({ jid: m.sender });
        const fromName = senderData?.name || m.pushName || 'Usuario';

        // Lógica de objetivo
        if (!targetJid || targetJid === m.sender) {
            targetName = "todos";
        } else {
            // Resolver LID a JID real usando tu función en core/utils.js
            const realTargetJid = await resolveLidToRealJid(targetJid, sock, from);
            const targetData = await User.findOne({ jid: realTargetJid });
            targetName = targetData?.name || '@' + realTargetJid.split('@')[0];
            mentions.push(realTargetJid);
        }

        // Cargar Videos desde el JSON
        if (!fs.existsSync(nsfwPath)) return console.error("❌ Error: nsfw.json no encontrado.");
        
        const nsfwData = JSON.parse(fs.readFileSync(nsfwPath));
        const videos = nsfwData[currentCommand];
        if (!videos || videos.length === 0) return;

        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        const actionSentence = captions[currentCommand](fromName, targetName);
        const finalCaption = `\`${fromName}\` ${actionSentence} ${randomSymbol}`;

        await sock.sendMessage(from, { 
            video: { url: randomVideo }, 
            gifPlayback: true, 
            caption: finalCaption, 
            mentions: mentions
        }, { quoted: m });

    } catch (e) {
        console.error("Error en NSFW Interact:", e);
    }
  }
};