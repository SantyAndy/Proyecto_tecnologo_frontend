#!/usr/bin/env bash
# Sirve el build de producción (con service worker) y abre un túnel HTTPS
# para poder instalar/probar la PWA en el móvil.
set -e
cd "$(dirname "$0")"
PORT="${PORT:-4000}"
CF="${CF:-$HOME/.local/bin/cloudflared}"

# 1) Build de producción si no existe
if [ ! -f dist/frontend/server/server.mjs ]; then
  echo "Compilando build de producción..."
  npm run build
fi

# 2) Servidor SSR de producción
echo "Levantando servidor en http://localhost:$PORT ..."
PORT="$PORT" node dist/frontend/server/server.mjs > /tmp/ssr_prod.log 2>&1 &
SRV=$!
trap 'kill $SRV $TUN 2>/dev/null' EXIT
sleep 4

# 3) Túnel HTTPS (--http-host-header evita el bloqueo SSRF de allowedHosts)
echo "Abriendo túnel HTTPS (espera la URL https://...trycloudflare.com)..."
"$CF" tunnel --url "http://localhost:$PORT" --http-host-header "localhost:4200" 2>&1 | tee /tmp/cf_tunnel.log &
TUN=$!

echo
echo ">>> Busca arriba la línea con https://XXXX.trycloudflare.com y ábrela en el móvil."
echo ">>> Ctrl+C para detener todo."
wait
