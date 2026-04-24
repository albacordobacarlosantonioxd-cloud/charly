const { WAConnection: { generateMessageID, waChatKey } } = require('@adiwajshing/baileys');
const axios = require('axios');
const fs = require('fs');

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
      
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      const imageBuffer = Buffer.from(base64Image, 'base64');
      
      await client.sendMessage(
        msg.key.remoteJid,
        imageBuffer,
        'image',
        {
          caption: `Aquí tienes tu código QR para: ${text}`,
          quoted: msg
        }
      );
    } catch (error) {
      console.error('Error generating QR code:', error);
      msg.reply('❌ Ocurrió un error al generar el código QR. Por favor, intenta de nuevo.');
    }
  }
};