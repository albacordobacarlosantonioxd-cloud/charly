import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";

export default {
    name: "pdf",
    category: 'herramientas',
    aliases: ["topng", "pdfimg"],
    run: async (sock, m, from, text, quoted) => {
        try {
            // Verificamos si es un documento PDF
            const isQuotedDoc = quoted?.documentMessage || m.message?.documentMessage;
            const mimetype = isQuotedDoc?.mimetype || "";

            if (!isQuotedDoc || !mimetype.includes("pdf")) {
                return sock.sendMessage(from, { text: '❌ Responde a un archivo PDF para convertirlo en imágenes.' }, { quoted: m });
            }

            await sock.sendMessage(from, { text: '⏳ *Convirtiendo PDF a imágenes... esto puede tardar dependiendo de las páginas.*' }, { quoted: m });

            // Descargamos el PDF
            const stream = await downloadContentFromMessage(isQuotedDoc, 'document');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Preparamos el formulario según lo que vimos en la imagen
            const formData = new FormData();
            formData.append('file', buffer, { 
                filename: 'documento.pdf', 
                contentType: 'application/pdf' 
            });
            formData.append('method', 'local'); // Según la imagen (Subir archivo)
            formData.append('mode', 'each_page'); // Modo: convertir cada página

            const apiKey = "sasuke";
            const apiUrl = `https://api.evogb.org/api/converter-pdf-to-img?key=${apiKey}`;

            const response = await axios.post(apiUrl, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0'
                },
                timeout: 120000 // Los PDFs pueden tardar en procesar
            });

            const res = response.data;

            // Si la API devuelve un array de imágenes (URLs)
            if (res.status && res.result) {
                const images = Array.isArray(res.result) ? res.result : [res.result];

                for (const imgUrl of images) {
                    await sock.sendMessage(from, { 
                        image: { url: imgUrl }, 
                        caption: `✅ Página procesada.` 
                    });
                }
            } else {
                throw new Error(res.message || 'La API no pudo procesar el PDF.');
            }

        } catch (err) {
            console.error("ERROR EN PDF2JPG:", err);
            let msg = "Error al convertir el PDF.";
            if (err.response?.data) {
                msg = err.response.data.message || msg;
            }
            sock.sendMessage(from, { text: `❌ Error: ${msg}` }, { quoted: m });
        }
    }
};
