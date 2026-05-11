import fetch from "node-fetch"

export default {
    name: "traducir",
    category: 'herramientas',
    aliases: ['trad'],
    run: async (sock, m, from, text, { usedPrefix, command }) => {
        const dev = "𝘽𝙮 𝘾𝙝𝙖𝙧𝙡𝙮"
        const chn = "𝘾𝙃𝘼𝙍𝙇𝙔-𝘽𝙊𝙏"

        // Detectamos si hay texto o si está citando un mensaje para traducir
        let q = text ? text : (m.quoted?.text || null)
        
        if (!q) return sock.sendMessage(from, { 
            text: `*𝚄𝚂𝙾 𝙲𝙾𝚁𝚁𝙴𝙲𝚃𝙾:* \nResponde a un mensaje o escribe un texto con el comando *${usedPrefix + command}* para pasarlo a español.` 
        }, { quoted: m })

        await sock.sendMessage(from, { react: { text: '🌎', key: m.key } })

        try {
            let lang = 'es'
            let input = q

            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(input)}`)
            const json = await res.json()

            if (!json || !json[0]) throw 'Error'

            const result = json[0].map(part => part[0]).join('')

            let info = `「 🌎 *CHARLY TRANSLATE* 」\n─── 🕒 ☆ : .☽ . : ☆ 🕒 ───\n\n`
            info += `📝 *ORIGINAL:* ${input}\n\n`
            info += `🔄 *TRADUCCIÓN:* ${result}\n\n`
            info += `─── 🕒 ☆ : .☽ . : ☆ 🕒 ───\n\n`
            info += `⚡ *${dev}*\n`
            info += `📡 *${chn}*`

            await sock.sendMessage(from, { text: info }, { quoted: m })
            await sock.sendMessage(from, { react: { text: '✅', key: m.key } })

        } catch (e) {
            console.error("Error en Traductor:", e)
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } })
            sock.sendMessage(from, { text: '🛑 El servidor de traducción está saturado o el texto es inválido.' }, { quoted: m })
        }
    }
}
