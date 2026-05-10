import fetch from "node-fetch"

export default {
    name: "imagen",
    category: 'herramientas',
    aliases: ['img', 'wallpaper'],
    run: async (sock, m, from, text) => {
        if (!text) return sock.sendMessage(from, { text: `*🏮 [ CHARLY-BOT ]*\n\nIngrese lo que desea buscar.\n*Ejemplo:* .imagen Yamaha MT-09 2024` }, { quoted: m })

        await sock.sendMessage(from, { react: { text: '🔍', key: m.key } })

        try {
            const apiDorratzV2 = `https://api.dorratz.com/v2/wallpaper-s?q=${encodeURIComponent(text)}`
            const apiUnsplashV3 = `https://api.dorratz.com/v3/unsplash?query=${encodeURIComponent(text)}`

            const sources = [apiDorratzV2, apiUnsplashV3]
            const selectedApi = sources[Math.floor(Math.random() * sources.length)]
            
            console.log(`[DEBUG] Buscando imagen en: ${selectedApi}`)

            let res = await fetch(selectedApi)
            let json = await res.json()
            let imageUrl = ''

            // Lógica para procesar la API seleccionada
            if (selectedApi.includes('v2/wallpaper-s')) {
                if (json.status === 200 && json.result?.length > 0) {
                    imageUrl = json.result[Math.floor(Math.random() * json.result.length)]
                }
            } else {
                if (json.result?.length > 0) {
                    const randomRes = json.result[Math.floor(Math.random() * json.result.length)]
                    imageUrl = randomRes.urls?.regular || randomRes.urls?.full
                }
            }

            // Si la primera opción falló, intentamos con el respaldo (Backup)
            if (!imageUrl) {
                console.log(`[DEBUG] Primera fuente falló, intentando backup...`)
                const backupApi = selectedApi === apiDorratzV2 ? apiUnsplashV3 : apiDorratzV2
                const res2 = await fetch(backupApi)
                const json2 = await res2.json()
                
                if (backupApi.includes('v2/wallpaper-s')) {
                    imageUrl = json2.result?.[0]
                } else {
                    imageUrl = json2.result?.[0]?.urls?.regular
                }
            }

            if (!imageUrl) {
                console.log(`[DEBUG] No se encontró imagen en ninguna fuente.`)
                await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
                return sock.sendMessage(from, { text: '⚠️ No se encontraron imágenes para tu búsqueda.' }, { quoted: m })
            }

            console.log(`[DEBUG] Imagen encontrada: ${imageUrl}`)

            await sock.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: `🏮 *CHARLY-BOT IMAGE* 🏮\n\n🔎 *Búsqueda:* ${text}\n⚡ *By Charly x Zona Devs*` 
            }, { quoted: m })

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

        } catch (e) {
            console.error("======== [ ERROR IMAGEN ] ========")
            console.error(e)
            console.error("================================")
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
            sock.sendMessage(from, { text: `🛑 Error al buscar la imagen: ${e.message}` }, { quoted: m })
        }
    }
}
