# 1. Usamos una imagen de Node.js ligera pero completa
FROM node:18-bullseye

# 2. Instalamos herramientas del sistema (ffmpeg y python)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Instalamos yt-dlp de forma global en el sistema
RUN pip3 install yt-dlp

# 4. Preparamos la carpeta de la app
WORKDIR /app

# 5. Copiamos solo los archivos de dependencias primero (para que sea más rápido)
COPY package*.json ./
RUN npm install

# 6. Copiamos el resto de tu código
COPY . .

# 7. Exponemos el puerto para Railway
EXPOSE 3000

# 8. Comando para arrancar el bot
CMD ["node", "index.js"]