import axios from "axios";

export default {
    name: "readmail",
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el correo a revisar." });

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/tools/tempmail-read?email=${encodeURIComponent(text)}&key=${key}`;

            const response = await axios.get(urlFinal);
            const res = response.data;

            // Verificamos que res.data sea un array y tenga mensajes
            if (res.status === true && Array.isArray(res.data) && res.data.length > 0) {
                let txt = `📩 *MENSAJES RECIBIDOS*\n\n`;
                
                res.data.forEach((msg, i) => {
                    txt += `*#${i + 1} De:* ${msg.from}\n`;
                    txt += `*Asunto:* ${msg.subject}\n`;
                    // CAMBIO AQUÍ: Usamos body_text que es donde viene tu código de Railway
                    txt += `*Mensaje:* ${msg.body_text || "Sin contenido"}\n`;
                    txt += `*--------------------------*\n`;
                });

                await sock.sendMessage(from, { text: txt }, { quoted: m });
            } else {
                await sock.sendMessage(from, { text: "Bandeja vacía. Espera un momento e intenta de nuevo." });
            }

        } catch (e) {
            console.error("ERROR EN READMAIL:", e.message);
            await sock.sendMessage(from, { text: "⚠️ Error al conectar con el servidor." });
        }
    }
};
