# Etapa 1: Instalar dependências e compilar o projeto
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --include=optional
COPY . .
RUN npm run build

# Etapa 2: Servir o site usando um servidor leve (como Nginx ou Node)
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production --include=optional
COPY --from=builder /app/dist ./dist

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.cjs"]
