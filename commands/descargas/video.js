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

        const tmpFile = path.join(process.cwd(), `tmp_${Date.now()}.mp4`);
        const outFile = path.join(process.cwd(), `out_${Date.now()}.mp4`);

        try {
            const search = await yts(text);
            const video = search.all[0];
            if (!video) return sock.sendMessage(from, { text: '⚠️ No se encontró.' });

            const dlApi = `https://api.evogb.org/dl/ytmp4?url=${encodeURIComponent(video.url)}&quality=360p&key=${key}`;
            const { data } = await axios.get(dlApi);
            if (!data.status) throw new Error("API error");

            // Descargamos el video físicamente al servidor
            const response = await axios({
                method: 'get',
                url: data.data.url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(tmpFile);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // RE-ENCODE: Forzamos formato compatible con WhatsApp (H.264 + AAC)
            // Esto arregla el error de "algo falló con el archivo"
            await execPromise(`ffmpeg -i ${tmpFile} -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -c:a aac -ac 2 -b:a 128k -movflags faststart ${outFile}`);

            const videoBuffer = fs.readFileSync(outFile);

            await sock.sendMessage(from, { 
                video: videoBuffer, 
                caption: `✅ *${video.title}*\n⚡ *${dev}*`,
                mimetype: 'video/mp4'
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error(error);
            sock.sendMessage(from, { text: '🛑 Error: El video no pudo ser procesado para WhatsApp.' });
        } finally {
            // Borramos los archivos para cuidar el espacio en Railway
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
            if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
        }
    }
};
