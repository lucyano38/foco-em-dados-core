FROM node:18-slim

RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN npm run build
CMD ["node", "dist/server.cjs"]
