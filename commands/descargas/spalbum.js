import fetch from 'node-fetch'

export default {
    name: "spalbum",
    category: 'descargas',
    aliases: ['albumsp', 'spa'],
    run: async (sock, m, from, text, { usedPrefix, command }) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮"
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏"
        
        let query = text ? text.trim() : (m.quoted?.text || null)
        
        if (!query || !query.includes('spotify.com')) return sock.sendMessage(from, { 
            text: `『 ⚡ *CHARLY ALBUM* ⚡ 』\n\n> 🧩 *Ingrese el link del álbum.*\n> 💡 *Ej:* ${usedPrefix + command} https://open.spotify.com/album/link` 
        }, { quoted: m })

        await sock.sendMessage(from, { react: { text: '💽', key: m.key } })

        try {
            // API de Delirius Store
            const res = await fetch(`https://api.delirius.store/download/spotifyalbum?url=${encodeURIComponent(query)}`)
            const json = await res.json()

            if (!json.status || !json.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                return sock.sendMessage(from, { text: '*🏮 [ ERROR ]* No se pudo obtener el álbum.' }, { quoted: m })
            }

            const album = json.data
            const tracks = json.tracks

            let txt = `┏━━━━━━━━━━━━━━━━━━┓\n`
            txt += `┃   🏮  *CHARLY ALBUM* 🏮\n`
            txt += `┣━━━━━━━━━━━━━━━━━━┛\n`
            txt += `┃\n`
            txt += `┃ 💿 *Áʟʙᴜᴍ:* ${album.name}\n`
            txt += `┃ 👤 *Aʀᴛɪsᴛᴀ:* ${tracks[0]?.artist || 'Varios'}\n`
            txt += `┃ 🔢 *Tᴏᴛᴀʟ Tʀᴀᴄᴋs:* ${album.total_tracks}\n`
            txt += `┃\n`
            txt += `┃ ⚙️ *Esᴛᴀᴅᴏ:* Descargando lista...\n`
            txt += `┃\n`
            txt += `┣━━━━━━━━━━━━━━━━━━┓\n`
            txt += `┃ ⚡ *${dev}*\n`
            txt += `┃ 📡 *${chn}*\n`
            txt += `┗━━━━━━━━━━━━━━━━━━┛`

            // 1. Mandamos la imagen del álbum y la info una sola vez
            await sock.sendMessage(from, { 
                image: { url: album.image }, 
                caption: txt 
            }, { quoted: m })

            // 2. Ciclo para mandar todos los audios
            for (let track of tracks) {
                if (track.url) {
                    await sock.sendMessage(from, { 
                        audio: { url: track.url }, 
                        mimetype: 'audio/mpeg', 
                        fileName: `${track.title}.mp3` 
                    }, { quoted: m })
                    
                    // Pequeña pausa de 2 segundos entre audios para evitar ban
                    await new Promise(resolve => setTimeout(resolve, 2000))
                }
            }

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

        } catch (e) {
            console.error("Error en SpAlbum:", e)
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
            sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m })
        }
    }
}
