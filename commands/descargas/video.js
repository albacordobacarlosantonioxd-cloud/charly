import axios from 'axios'
import yts from 'yt-search'

export default {
    name: "ytmp4",
    category: 'downloader',
    aliases: ['video', 'v'],
    // Ajustamos para recibir el objeto con 'usedPrefix' y 'command'
    run: async (sock, m, from, text, { usedPrefix, command }) => {
        
        // Usamos m.quoted.text gracias a la mejora del index de ayer
        let query = text ? text.trim() : (m.quoted?.text || null)
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮";

        if (!query) return sock.sendMessage(from, { text: `✨ *¿Qué video deseas descargar?*\n\n> *Ejemplo:* ${usedPrefix + command} https://www.youtube.com/watch?v=xxx\n> *O también:* ${usedPrefix + command} mt09 black` }, { quoted: m })

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } })

        try {
            console.log(`[DEBUG] Iniciando búsqueda para: ${query}`)
            
            const search = await yts(query)
            const video = search.all[0]

            if (!video) {
                console.log(`[DEBUG] No se encontró nada con yt-search`)
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                return sock.sendMessage(from, { text: '⚠️ No se encontraron resultados.' }, { quoted: m })
            }

            const urlVideo = video.url
            console.log(`[DEBUG] Video encontrado: ${video.title} | URL: ${urlVideo}`)

            // Llamada a la API de Delirius
            const { data } = await axios.get(`https://api.delirius.store/download/ytmp4?url=${urlVideo}`)

            console.log(`[DEBUG] Respuesta Delirius:`, JSON.stringify(data, null, 2))

            if (!data.status) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                return sock.sendMessage(from, { text: '⚠️ La API no pudo procesar este video.' }, { quoted: m })
            }

            const vid = data.data
            const linkDescarga = vid.download

            let info = `🎥 *YOUTUBE MP4 — CHARLY-BOT*\n\n`
            info += `📌 *Título:* ${vid.title}\n`
            info += `👤 *Canal:* ${vid.author || video.author.name}\n`
            info += `⚙️ *Calidad:* ${vid.quality || '360p'}\n\n`
            info += `> *${dev} x Zona Developers*`

            console.log(`[DEBUG] Enviando video desde: ${linkDescarga}`)

            // Enviamos el video
            await sock.sendMessage(from, { 
                video: { url: linkDescarga }, 
                caption: info,
                mimetype: 'video/mp4',
                fileName: `${vid.title}.mp4`
            }, { quoted: m })

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

        } catch (e) {
            console.error("======== [ ERROR YTMP4 ] ========")
            console.error(e)
            
            // Si es el error 502 que te salía hace rato
            if (e.response?.status === 502) {
                await sock.sendMessage(from, { react: { text: '🪫', key: m.key } })
                return sock.sendMessage(from, { text: '⚠️ El servidor de descargas está saturado. Intenta de nuevo en unos segundos.' }, { quoted: m })
            }

            await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
            sock.sendMessage(from, { text: `⚠️ Error al obtener el video: ${e.message}` }, { quoted: m })
        }
    }
}
