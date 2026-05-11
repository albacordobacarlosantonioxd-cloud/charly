export default {
  name: 'setgpdesc',
  aliases: ['setdesc', 'descgrupo'],
  category: 'grupos',
  run: async (sock, m, from, text, { isAdmin, isGroup, args }) => {
    
    // 1. Verificaciones de seguridad
    if (!isGroup) return sock.sendMessage(from, { text: "❌ Este comando solo funciona en grupos." }, { quoted: m });
    
    if (!isAdmin) {
        return sock.sendMessage(from, { text: "⚠️ Solo los administradores pueden cambiar la descripción del grupo." }, { quoted: m });
    }

    // 2. Extraer la nueva descripción (usando args del paquete extra)
    const newDesc = args.join(' ').trim();

    if (!newDesc) {
      return sock.sendMessage(from, { text: '《✧》 Por favor, ingresa la nueva descripción que deseas ponerle al grupo.' }, { quoted: m });
    }

    try {
      // 3. Ejecutar el cambio en WhatsApp
      await sock.groupUpdateDescription(from, newDesc);
      
      await sock.sendMessage(from, { text: '✅ La descripción del grupo se modificó correctamente.' }, { quoted: m });

    } catch (e) {
      console.error("Error al cambiar descripción:", e);
      return sock.sendMessage(from, { 
        text: `> Ocurrió un error inesperado al intentar cambiar la descripción.\n> [Error: *${e.message}*]` 
      }, { quoted: m });
    }
  },
};
