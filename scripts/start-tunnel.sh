#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd /data/data/com.termux/files/home/foco-em-dados-core

echo "==> Build do servidor"
npm run build

echo "==> Iniciando servidor local"
PORT=8080 node dist/server.cjs &
SERVER_PID=$!

echo "==> Iniciando tunnel Cloudflare"
cloudflared tunnel --url http://localhost:8080 &
TUNNEL_PID=$!

cleanup() {
  echo "==> Encerrando processos..."
  kill "$SERVER_PID" "$TUNNEL_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Servidor PID=$SERVER_PID"
echo "==> Tunnel PID=$TUNNEL_PID"
echo "==> Aguardando URL do tunnel..."
sleep 4

TUNNEL_URL=$(grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /proc/$(pgrep -f "cloudflared tunnel --url")/fd/1 2>/dev/null | head -n1 || true)
if [ -z "$TUNNEL_URL" ]; then
  TUNNEL_URL=$(ps -ef | grep 'cloudflared tunnel --url' | grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' | head -n1 || true)
fi
if [ -z "$TUNNEL_URL" ]; then
  echo "==> URL do tunnel ainda não detectada. Veja o log do cloudflared."
else
  echo "==> Tunnel público: $TUNNEL_URL"
fi

echo "==> Site local: http://localhost:8080"
echo "==> Pressione Ctrl+C para parar."

wait -n
wait
