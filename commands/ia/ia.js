import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
import { User } from '../../index.js';

export default {
    name: "ia", // <--- AQUÍ declaras el comando
    aliases: ["bot", "groq", "pregunta"], // Alias para que responda a varios
    category: "ia",
    run: async (sock, m, from, text, quoted, args, isAdmin, isGroup) => {
        const sender = m.sender;
        
        if (!text) return sock.sendMessage(from, { text: '¿Qué pasó, pariente? Dime qué quieres preguntarme.' }, { quoted: m });

        try {
            // 1. Buscamos o creamos al usuario en Mongo
            let user = await User.findOne({ jid: sender });
            if (!user) {
                user = await User.create({ jid: sender, name: m.pushName || 'Usuario', history: [] });
            }

            // 2. Configuramos el sistema (Personalidad del bot)
            let messages = [
                { 
                    role: "system", 
                    content: `Eres un bot de WhatsApp divertido y servicial. Hablas como un compa de México (usa jerga como "qué onda", "pariente", "arre"). Eres experto en programación, el juego Free Fire y motos Yamaha MT-09. El usuario se llama ${m.pushName || 'pariente'}.` 
                }
            ];

            // 3. Añadimos historial de Mongo para que tenga memoria
            if (user.history && user.history.length > 0) {
                messages.push(...user.history);
            }

            messages.push({ role: "user", content: text });

            // 4. Llamada a la API de Groq
            const chatCompletion = await groq.chat.completions.create({
                messages: messages,
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 1024
            });

            const respuestaIA = chatCompletion.choices[0]?.message?.content || "No supe qué decirte, compa.";

            // 5. Guardar la nueva plática en el historial de Mongo
            user.history.push({ role: "user", content: text });
            user.history.push({ role: "assistant", content: respuestaIA });

            // Mantener solo los últimos 10 mensajes para no saturar la DB
            if (user.history.length > 10) {
                user.history = user.history.slice(-10);
            }

            user.markModified('history'); 
            await user.save();

            // 6. Enviar respuesta
            await sock.sendMessage(from, { text: respuestaIA }, { quoted: m });

        } catch (err) {
            console.error("Error en el comando IA:", err);
            await sock.sendMessage(from, { text: '❌ Valio barriga, la IA se trabó. Intenta de nuevo.' }, { quoted: m });
        }
    }
};