#!/usr/bin/env bash
# Hetzner API host bootstrap — run as root on the VPS
# Usage: bash scripts/hetzner-bootstrap.sh
set -euo pipefail

APP_DIR=/opt/bpex-pro
REPO=https://github.com/fazalurrehman9511/Bpex-Pro.git
NODE_MAJOR=20

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw nginx certbot python3-certbot-nginx git build-essential

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only origin main || true
fi

cd "$APP_DIR/server"
npm ci --omit=dev

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "==> Edit $APP_DIR/server/.env then re-run pm2 start"
  echo "    nano $APP_DIR/server/.env"
  echo ""
fi

mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cat >/etc/nginx/sites-available/api.bpexpro.com <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name api.bpexpro.com;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
NGINX

ln -sfn /etc/nginx/sites-available/api.bpexpro.com /etc/nginx/sites-enabled/api.bpexpro.com
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo ""
echo "Bootstrap done."
echo "1) nano $APP_DIR/server/.env   (set secrets + BPEXCH_HTTP_PROXY + SERVE_FRONTEND=0)"
echo "2) cd $APP_DIR/server && pm2 start src/index.js --name bpex-api && pm2 save && pm2 startup"
echo "3) DNS A record: api.bpexpro.com -> this server IP"
echo "4) certbot --nginx -d api.bpexpro.com"
echo "5) curl -sS https://api.bpexpro.com/api/health"
echo "6) Test proxy: curl -x \"\$BPEXCH_HTTP_PROXY\" -sS --max-time 30 https://api.ipify.org/"
