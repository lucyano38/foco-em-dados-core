# Estágio de Build
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Estágio de Execução
FROM node:18
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
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist/server.cjs ./server.cjs
RUN npm install --production

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
CMD ["node", "server.cjs"]
