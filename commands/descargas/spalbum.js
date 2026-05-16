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
            // 1. Obtenemos la lista de canciones
            const res = await fetch(`https://api.delirius.store/download/spotifyalbum?url=${encodeURIComponent(query)}`)
            const json = await res.json()

            if (!json.status || !json.data) {
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                return sock.sendMessage(from, { text: '*🏮 [ ERROR ]* No pude obtener el álbum.' }, { quoted: m })
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
            txt += `┃ ⚙️ *Esᴛᴀᴅᴏ:* Enviando audios...\n`
            txt += `┃\n`
            txt += `┣━━━━━━━━━━━━━━━━━━┓\n`
            txt += `┃ ⚡ *${dev}*\n`
            txt += `┃ 📡 *${chn}*\n`
            txt += `┗━━━━━━━━━━━━━━━━━━┛`

            // Mandamos la portada primero
            await sock.sendMessage(from, { 
                image: { url: album.image }, 
                caption: txt 
            }, { quoted: m })

            // 2. Ciclo de descarga y envío (FOR SECUENCIAL)
            for (const track of tracks) {
                try {
                    // Llamamos a la descarga individual usando el link que nos dio el album
                    const dlRes = await fetch(`https://api.delirius.store/download/spotifydl?url=${encodeURIComponent(track.url)}`)
                    const dlData = await dlRes.json()

                    // Verificamos dónde viene el link (data.link o data.url)
                    const audioUrl = dlData.data?.link || dlData.data?.url

                    if (audioUrl) {
                        await sock.sendMessage(from, { 
                            audio: { url: audioUrl }, 
                            mimetype: 'audio/mpeg', 
                            fileName: `${track.title}.mp3` 
                        }, { quoted: m })
                        
                        // Pausa necesaria para que no se sature tu Zorin OS
                        await new Promise(resolve => setTimeout(resolve, 4000))
                    }
                } catch (err) {
                    console.error(`[ERROR TRACK] ${track.title}:`, err.message)
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
