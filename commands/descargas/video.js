import axios from 'axios';
import yts from 'yt-search';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default {
    name: "ytvideo",
    category: 'descargas',
    aliases: ["video"],
    run: async (sock, m, from, text, command) => {
        const key = "sasuke";
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";

        if (!text) return sock.sendMessage(from, { text: `*Escribe el nombre del video.*` }, { quoted: m });

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const tmpFile = path.join(process.cwd(), `raw_${Date.now()}.mp4`);
        const outFile = path.join(process.cwd(), `fixed_${Date.now()}.mp4`);

        try {
            // 1. Buscamos con yt-search para tener la info bonita
            const search = await yts(text);
            const video = search.all[0];
            if (!video) return sock.sendMessage(from, { text: '⚠️ No se encontró.' });

            // 2. Usamos TU API (la de la imagen)
            const dlApi = `https://api.evogb.org/dl/ytmp4?url=${encodeURIComponent(video.url)}&quality=360p&key=${key}`;
            const { data } = await axios.get(dlApi);
            if (!data.status) throw new Error("API error");

            // 3. Descarga temporal al disco (para procesar el códec)
            const response = await axios({ method: 'get', url: data.data.url, responseType: 'stream' });
            const writer = fs.createWriteStream(tmpFile);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // 4. FIX DE CÓDEC: Convertimos el audio a AAC estándar y el video a H.264
            // Esto arregla el error de "decodificador necesario" que viste en tu PC
            await execPromise(`ffmpeg -i ${tmpFile} -c:v copy -c:a aac -b:a 128k -movflags faststart ${outFile}`);

            const videoBuffer = fs.readFileSync(outFile);

            // 5. Enviar a WhatsApp
            await sock.sendMessage(from, { 
                video: videoBuffer, 
                caption: `✅ *${video.title}*\n⚡ *${dev}*`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error(error);
            sock.sendMessage(from, { text: '🛑 Error: La API mandó un archivo que no se pudo procesar.' });
        } finally {
            // Limpiamos los archivos en Railway (recuerda que solo tienes 1GB de RAM)
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
            if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
        }
    }
};
