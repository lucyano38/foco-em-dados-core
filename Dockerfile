# Estágio de Build
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Estágio de Execução
FROM node:18
WORKDIR /app
# Copia o servidor compilado e a pasta dist
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
# Instala apenas dependências de produção
RUN npm install --production
# Define a porta (Cloud Run injeta essa variável, mas é bom garantir)
ENV PORT=8080
EXPOSE 8080
# Comando de inicialização correto para o arquivo .cjs
CMD ["node", "dist/server.cjs"]
