const axios = require('axios');

module.exports = {
  name: 'qr',
  aliases: ['qrcode'],
  execute: async (client, msg, args) => {
    try {
      const text = args.join(' ');
      if (!text) {
        return msg.reply('❌ Por favor, ingresa un texto o enlace para generar el QR');
      }

      const imageUrl = `https://api.alyacore.xyz/tools/qrcode?text=${encodeURIComponent(text)}&key=${process.env.ALYA_KEY}`;
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      await client.sendMessage(
        msg.key.remoteJid,
        {
          image: imageBuffer,
          caption: `🔳 Aquí tienes tu código QR para: ${text}`
        },
        { quoted: msg }
      );

    } catch (error) {
      console.error('Error al generar el código QR:', error);
      msg.reply('❌ Ocurrió un error al generar el código QR. Por favor, intenta de nuevo.');
    }
  }
};