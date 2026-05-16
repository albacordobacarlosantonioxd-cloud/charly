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
            text: `『 ⚡ *CHARLY ALBUM* ⚡ 』\n\n> 🧩 *Ingrese el link del álbum.*\n> 💡 *Ej:* ${usedPrefix + command} https://open.spotify.com/album/22DL6IRGNYNenKej7aw8pO` 
        }, { quoted: m })

        await sock.sendMessage(from, { react: { text: '💽', key: m.key } })

        try {
            // 1. Obtenemos la lista de canciones del álbum
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
            txt += `┃ ⚙️ *Esᴛᴀᴅᴏ:* Descargando audios...\n`
            txt += `┃\n`
            txt += `┣━━━━━━━━━━━━━━━━━━┓\n`
            txt += `┃ ⚡ *${dev}*\n`
            txt += `┃ 📡 *${chn}*\n`
            txt += `┗━━━━━━━━━━━━━━━━━━┛`

            // Mandamos la portada con la info
            await sock.sendMessage(from, { 
                image: { url: album.image }, 
                caption: txt 
            }, { quoted: m })

            // 2. Ciclo para convertir cada track a MP3 real
            for (let track of tracks) {
                try {
                    // Llamamos al endpoint de descarga individual para obtener el audio real
                    const dlRes = await fetch(`https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(track.url)}`)
                    const dlData = await dlRes.json()

                    if (dlData.status && dlData.data.url) {
                        await sock.sendMessage(from, { 
                            audio: { url: dlData.data.url }, 
                            mimetype: 'audio/mpeg', 
                            fileName: `${track.title}.mp3` 
                        }, { quoted: m })
                        
                        // Pausa de 3 segundos para no saturar tu Zorin OS ni la API
                        await new Promise(resolve => setTimeout(resolve, 3000))
                    }
                } catch (err) {
                    console.log(`Error descargando track: ${track.title}`)
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
