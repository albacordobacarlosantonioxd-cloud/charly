import axios from "axios";

export default {
    name: "tempmail",
    category: 'herramientas',
    run: async (sock, m, from, text, quoted) => {
        try {
            const key = "sasuke"; 
            const urlFinal = `https://api.evogb.org/tools/tempmail?key=${key}`;

            const response = await axios.get(urlFinal);
            const res = response.data;

            // Ahora sí, entramos a res.data porque ahí viene el email
            if (res.status === true && res.data && res.data.email) {
                let emailGenerado = res.data.email; 

                let txt = `📧 *CORREO TEMPORAL*\n\n`;
                txt += `*Email:* ${emailGenerado}\n\n`;
                txt += `_Copia el correo de arriba. Para leer mensajes usa:_ \n*.readmail ${emailGenerado}*`;

                await sock.sendMessage(from, { text: txt }, { quoted: m });
            } else {
                // Si la estructura cambia, esto nos avisará
                await sock.sendMessage(from, { text: "❌ Error: La API cambió la estructura o el correo no llegó." }, { quoted: m });
            }

        } catch (e) {
            console.error("ERROR EN TEMPMAIL:", e.message);
            await sock.sendMessage(from, { text: "⚠️ El servidor está fallando." });
        }
    }
};
