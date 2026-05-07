import evogb from "../../lib/apiClient.js";

export default {
    name: "tempmail",
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/tools/tempmail?key=${key}`;

            console.log("--- DEBUG TEMPMAIL ---");
            console.log("Solicitando correo temporal...");

            const response = await evogb.get(urlFinal, { timeout: 10000 });
            
            // Log para ver qué llega exactamente de la API en el servidor
            console.log("Respuesta completa Tempmail:", JSON.stringify(response.data));

            const res = response.data;

            // Validamos la estructura según tu JSON
            if (res.status === true && res.data && res.data.email) {
                let emailGenerado = res.data.email; 

                let txt = `📧 *CORREO TEMPORAL*\n\n`;
                txt += `*Email:* ${emailGenerado}\n\n`;
                txt += `_Copia el correo de arriba. Para leer mensajes usa:_ \n*.readmail ${emailGenerado}*`;

                await sock.sendMessage(from, { text: txt }, { quoted: m });
            } else {
                console.error("❌ Estructura de API inesperada:", res);
                await sock.sendMessage(from, { 
                    text: "❌ Error: No se pudo generar el correo. La API cambió o está en mantenimiento." 
                }, { quoted: m });
            }

        } catch (e) {
            console.error("--- ERROR TEMPMAIL DETALLADO ---");
            if (e.response) {
                // Error del servidor de la API (403, 404, 500)
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
            } else if (e.request) {
                // No hubo respuesta del servidor
                console.error("No se recibió respuesta del servidor de Evo.");
            } else {
                console.error("Mensaje:", e.message);
            }

            await sock.sendMessage(from, { text: "⚠️ El servidor de correos está fallando. Intenta de nuevo más tarde." });
        }
    }
};
