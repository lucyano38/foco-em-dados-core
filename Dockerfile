# Use uma imagem leve de Node.js
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de build
COPY dist ./dist
COPY package.json ./

# Instala apenas dependências de produção (se houver)
RUN npm install --production

# Expõe a porta que o Cloud Run usa
EXPOSE 8080

# Comando que força o início do seu servidor
CMD ["node", "dist/server.cjs"]
