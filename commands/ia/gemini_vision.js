import axios from 'axios';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: "responde", // Nombre principal
    aliases: ["ayuda", "tarea", "soluciona"], // Alias que activan el mismo código
    category: "ia",
    run: async (sock, m, from, text, quoted) => {
        try {
            // 1. EXTRAER LA IMAGEN (Mejorado: Quoted o Mensaje Directo)
            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            // Si es mensaje directo con leyenda, el mensaje es m.message
            const directMsg = m.message?.imageMessage || m.message?.videoMessage; 
            
            // Buscamos la imagen/video en la respuesta o en el mensaje actual
            const mediaMessage = quotedMsg?.imageMessage || quotedMsg?.videoMessage || directMsg;

            if (!mediaMessage) {
                return sock.sendMessage(from, { text: '❌ No veo la foto o video, wero. Asegúrate de responder a una imagen o enviarla con el comando como leyenda.' }, { quoted: m });
            }

            // 2. DETECTAR QUÉ COMANDO SE USÓ (Para cambiar el Prompt)
            const body = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || "";
            const commandUsed = body.trim().split(' ')[0].slice(1).toLowerCase(); // Ej: 'ayuda' o 'responde'
            
            // 3. CONFIGURACIÓN (Tu API Key de Gemini 2.5)
            const apiKey = process.env.GEMINI_API_KEY; 
            if (!apiKey) return console.error("❌ GEMINI_API_KEY no configurada en .env");
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            // Determinar tipo de media para el mime_type
            const isVideo = mediaMessage.seconds ? true : false;
            const mimeType = isVideo ? "video/mp4" : "image/jpeg";

            await sock.sendMessage(from, { text: `🔍 ¡Ya encontré el ${isVideo ? 'video' : 'foto'}! Analizando con Gemini 2.5 Flash...` }, { quoted: m });

            // 4. DESCARGAR EL MEDIA
            const stream = await downloadContentFromMessage(mediaMessage, isVideo ? 'video' : 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const base64Media = buffer.toString('base64');

            // 5. PREPARAR EL PROMPT DILIGENCIADO
            let instrucciones = "";
            let emoji = "";

            if (commandUsed === 'ayuda') {
                emoji = "👀";
                instrucciones = "Describe detalladamente qué aparece en esta imagen o video. Sé observador y divertido, como un compa de México.";
            } else if (commandUsed === 'responde' || commandUsed === 'tarea') {
                emoji = "🧠";
                instrucciones = "Analiza la imagen o video y resuelve el problema, tarea, pregunta o ejercicio que aparezca, paso a paso y de forma clara.";
            } else {
                // Prompt por defecto si usa un alias no específico
                emoji = "🤖";
                instrucciones = "Analiza este contenido multimedia y responde a lo que se te pide.";
            }

            // Unimos instrucciones fijas con el texto opcional del usuario
            const finalPrompt = `${instrucciones}${text ? ` Además, el usuario añade esta consulta específica: ${text}` : ""}`;

            // 6. LLAMADA A LA API DE GEMINI
            const response = await axios.post(url, {
                contents: [{
                    parts: [
                        { text: finalPrompt },
                        { inline_data: { mime_type: mimeType, data: base64Media } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4, // Un poco más bajo para ser más preciso en tareas
                    maxOutputTokens: 2048,
                }
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data.candidates && response.data.candidates[0].content) {
                const resultado = response.data.candidates[0].content.parts[0].text;
                
                // 7. ENVIAR RESPUESTA FINAL
                await sock.sendMessage(from, { text: `${emoji} *GEMINI 2.5 FLASH DICE:*\n\n${resultado}` }, { quoted: m });
                console.log(`[📸] Análisis multimodal completado (${commandUsed}).`);
            } else {
                await sock.sendMessage(from, { text: '⚠️ Gemini recibió la imagen pero no pudo generar una respuesta (posible bloqueo de contenido).' }, { quoted: m });
            }

        } catch (e) {
            console.error("ERROR EN VISION:", e);
            let errorExtra = e.response?.data?.error?.message || e.message;
            await sock.sendMessage(from, { text: `❌ Valio barriga, pariente. Hubo un fallo al procesar la imagen.\n> Error: ${errorExtra}` }, { quoted: m });
        }
    }
};