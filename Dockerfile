FROM node:20-slim

WORKDIR /app

# Argumentos do Vite (injetados pelo Cloud Build em tempo de compilação)
ARG VITE_SUPABASE_URL="https://ioijbixifvbosythznhh.supabase.co"
ARG VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaWpiaXhpZnZib3N5dGh6bmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjk4MzksImV4cCI6MjA5OTk0NTgzOX0.mnX7iKNChokWSGnJm8iep58Cu_syKKOpr-ywwKt2hBs"
ARG VITE_STRIPE_PUBLISHABLE_KEY="pk_live_51SYO3jFP2uFvAXtTYha0OZkQY7HqCGwr0RJxSwnOJUFG2baIpsM2iBb6YTX9nxcImqm2NMeUkEldCvmJwXmBzrvt00fUihvp4W"

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Copia apenas os arquivos de dependência primeiro (para usar cache)
COPY package*.json ./

# Instala as dependências limpas no Linux
RUN npm ci

# Agora copia o restante do código (respeitando o seu .dockerignore)
COPY . .

# Compila o projeto (Vite / Tailwind) + o backend (esbuild)
RUN npm run build

EXPOSE 8080
CMD ["node", "dist/server.cjs"]
