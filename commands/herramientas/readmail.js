import axios from "axios";

export default {
    name: "readmail",
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        if (!text) return sock.sendMessage(from, { text: "Escribe el correo a revisar." });

        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/tools/tempmail-read?email=${encodeURIComponent(text)}&key=${key}`;

            console.log("--- DEBUG READMAIL ---");
            console.log("Revisando bandeja de:", text);

            const response = await axios.get(urlFinal, { timeout: 15000 });
            
            // Log para ver si la API devuelve un array, un objeto o un error
            console.log("Respuesta completa Readmail:", JSON.stringify(response.data));

            const res = response.data;

            // Verificamos que res.data sea un array y tenga mensajes
            if (res.status === true && Array.isArray(res.data) && res.data.length > 0) {
                let txt = `📩 *MENSAJES RECIBIDOS*\n\n`;
                
                res.data.forEach((msg, i) => {
                    txt += `*#${i + 1} De:* ${msg.from}\n`;
                    txt += `*Asunto:* ${msg.subject}\n`;
                    // Usamos body_text o body como respaldo
                    txt += `*Mensaje:* ${msg.body_text || msg.body || "Sin contenido"}\n`;
                    txt += `*--------------------------*\n`;
                });

                await sock.sendMessage(from, { text: txt }, { quoted: m });
            } else if (res.status === true && res.data.length === 0) {
                // Caso específico: la API conecta pero no hay correos aún
                await sock.sendMessage(from, { text: "Bandeja vacía. Espera a que llegue el código e intenta de nuevo." });
            } else {
                console.error("❌ Respuesta inesperada de la API:", res);
                await sock.sendMessage(from, { text: "No se pudo acceder a la bandeja. Verifica el correo." });
            }

        } catch (e) {
            console.error("--- ERROR READMAIL DETALLADO ---");
            if (e.response) {
                // Error de la API (403, 401, 500)
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
            } else {
                console.error("Mensaje:", e.message);
            }
            
            await sock.sendMessage(from, { text: "⚠️ Error al conectar con el servidor de correos." });
        }
    }
};
