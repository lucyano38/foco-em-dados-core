FROM node:20-slim

WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (para usar cache)
COPY package*.json ./

# Instala as dependências limpas no Linux
RUN npm ci

# Agora copia o restante do código (respeitando o seu novo .dockerignore)
COPY . .

# Compila o projeto (Vite / Tailwind)
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/server.cjs"]
