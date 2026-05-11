import fetch from 'node-fetch'

export default {
    name: "spotify",
    category: 'descargas',
    aliases: ['sp', 'music', 'spt'],
    run: async (sock, m, from, text, { usedPrefix, command }) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮"
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏" // <--- Actualizado aquí
        
        let query = text ? text.trim() : (m.quoted?.text || null)
        
        if (!query) return sock.sendMessage(from, { 
            text: `『 ⚡ *CHARLY SPOTIFY* ⚡ 』\n\n> 🧩 *Ingrese nombre o link de la canción.*\n> 💡 *Ej:* ${usedPrefix + command} Mask Off` 
        }, { quoted: m })

        await sock.sendMessage(from, { react: { text: '⚡', key: m.key } })

        try {
            const b = (s) => Buffer.from(s, 'base64').toString('utf-8')
            const a = b("aHR0cHM6Ly9hcGkuZXZvZ2Iub3Jn")
            const k = b("c2FzdWtl")

            let trackUrl = query
            const isUrl = query.match(/^(https?:\/\/)?(open\.spotify\.com|spotify\.link)\/.+$/gi)

            if (!isUrl) {
                const sRes = await fetch(`${a}/search/spotify?query=${encodeURIComponent(query)}&key=${k}`)
                const sData = await sRes.json()
                if (!sData.status || !sData.result.length) {
                    await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                    return sock.sendMessage(from, { text: '*🏮 [ ERROR ]* No encontré ninguna canción con ese nombre.' }, { quoted: m })
                }
                trackUrl = sData.result[0].link
            }

            const dlRes = await fetch(`${a}/dl/spotify?url=${encodeURIComponent(trackUrl)}&key=${k}`)
            const dlData = await dlRes.json()

            if (!dlData.status) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                return sock.sendMessage(from, { text: '*🏮 [ FALLO ]* Error al extraer el audio de Spotify.' }, { quoted: m })
            }

            const info = dlData.data

            let txt = `┏━━━━━━━━━━━━━━━━━━┓\n`
            txt += `┃   🏮  *CHARLY SPOTIFY* 🏮\n`
            txt += `┣━━━━━━━━━━━━━━━━━━┛\n`
            txt += `┃\n`
            txt += `┃ 🎵 *Tɪ́ᴛᴜʟᴏ:* ${info.name}\n`
            txt += `┃ 👤 *Aʀᴛɪsᴛᴀ:* ${info.artist}\n`
            txt += `┃ 💿 *Áʟʙᴜᴍ:* ${info.album}\n`
            txt += `┃ ⏱️ *Tɪᴇᴍᴘᴏ:* ${info.duration}\n`
            txt += `┃\n`
            txt += `┃ ⚙️ *Esᴛᴀᴅᴏ:* 🟢 Inyectado\n`
            txt += `┃\n`
            txt += `┣━━━━━━━━━━━━━━━━━━┓\n`
            txt += `┃ ⚡ *${dev}*\n`
            txt += `┃ 📡 *${chn}*\n`
            txt += `┗━━━━━━━━━━━━━━━━━━┛`

            await sock.sendMessage(from, { 
                image: { url: info.imageHD || info.image }, 
                caption: txt 
            }, { quoted: m })

            await sock.sendMessage(from, { 
                audio: { url: info.url }, 
                mimetype: 'audio/mpeg', 
                fileName: `${info.name}.mp3` 
            }, { quoted: m })

            await sock.sendMessage(from, { react: { text: '🔥', key: m.key } })

        } catch (e) {
            console.error("Error en Spotify:", e)
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
            sock.sendMessage(from, { text: `❌ Ocurrió un error inesperado: ${e.message}` }, { quoted: m })
        }
    }
}
