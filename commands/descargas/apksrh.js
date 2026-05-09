import fetch from "node-fetch";

export default {
    name: "apk",
    category: 'descargas',
    aliases: ["dapk", "modapk"],
    run: async (sock, m, from, text) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏";
        
        // Decodifiqué la llave 'sasuke' para que sea más directo en tu servidor
        const apiKey = "sasuke"; 

        if (!text.trim()) {
            return sock.sendMessage(from, { 
                text: `╭─〔 ♆ *CHARLY-BOT APK* ♆ 〕─╮\n│\n│ 📥 *USO CORRECTO:* \n│ .apk [nombre de la app]\n│\n│ 🌑 "Todo el poder del software"\n╰────────────────────────────╯` 
            }, { quoted: m });
        }

        // Reacción de espera
        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {    
            // Motor 1: Búsqueda de info y banner
            let resGata = await fetch(`https://api.evogb.org/search/apk?query=${encodeURIComponent(text)}&key=${apiKey}`);
            let jsonGata = await resGata.json();

            if (!jsonGata.status || !jsonGata.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '❌ No se encontró información de la aplicación.' }, { quoted: m });
            }

            const appData = jsonGata.data;
            
            // Motor 2: Obtención del link de descarga
            let resDeli = await fetch(`https://api.delirius.store/download/apk?query=${encodeURIComponent(appData.name)}`);
            let jsonDeli = await resDeli.json();

            if (!jsonDeli.status || !jsonDeli.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(from, { text: '❌ Error al procesar el archivo de descarga.' }, { quoted: m });
            }

            const dlUrl = jsonDeli.data.download;
            
            let info = `「 🎬 CHARLY-BOT APK 」\n─── 🕒 ☆ : .☽ . : ☆ 🕒 ───\n`;
            info += `│ 📦 *NOMBRE:* ${appData.name}\n`;
            info += `│ ⚖️ *TAMAÑO:* ${appData.size}\n`;
            info += `│ 📅 *ACTUALIZADO:* ${appData.lastUpdated}\n`;
            info += `─── 🕒 ☆ : .☽ . : ☆ 🕒 ───\n\n`;
            info += `🚀 *Enviando APK... por favor espera.*\n\n`;
            info += `⚡ *${dev}*\n`;
            info += `👑 *Powered by CHARLY-BOT*`;

            // Enviar Banner con info
            await sock.sendMessage(from, { 
                image: { url: appData.banner }, 
                caption: info
            }, { quoted: m });

            // Enviar el archivo APK
            await sock.sendMessage(from, { 
                document: { url: dlUrl }, 
                mimetype: 'application/vnd.android.package-archive', 
                fileName: `${appData.name}.apk` 
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error en APK Downloader:", e);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: '🛑 Error en el proceso de búsqueda o descarga.' }, { quoted: m });
        }
    }
};
