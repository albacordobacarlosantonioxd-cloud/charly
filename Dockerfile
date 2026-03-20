# 1. Usamos la imagen oficial de Node.js (versión 20 es la más estable)
FROM node:20-bullseye

# 2. Instalamos FFmpeg (necesario para que WhatsApp procese bien los audios/videos)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Creamos la carpeta de la app
WORKDIR /app

# 4. Copiamos los archivos de dependencias primero para acelerar el build
COPY package*.json ./

# 5. Instalamos solo las librerías necesarias (axios, yt-search, etc.)
RUN npm install --production

# 6. Copiamos todo el código de tu bot al contenedor
COPY . .

# 7. Exponemos el puerto que usa Railway (usualmente el 3000)
EXPOSE 3000

# 8. Comando para arrancar el bot
CMD ["node", "index.js"]