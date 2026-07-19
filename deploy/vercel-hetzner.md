# Frontend on Vercel + Backend on Hetzner

Recommended split so `/login` and `/dashboard` stay on **bpexpro.com** while Node + BPEXCH proxy + DataImpulse run on a VPS that allows outbound port **823**.

```text
Browser → https://bpexpro.com          (Vercel — React SPA)
              ├─ /api/*      ──rewrite──► https://api.bpexpro.com  (Hetzner Node)
              ├─ /bpexch/*   ──rewrite──► https://api.bpexpro.com
              └─ /uploads/*  ──rewrite──► https://api.bpexpro.com
```

Same-origin from the browser’s point of view → BPEXCH cookies + embed keep working.  
Leave `VITE_API_URL` **empty** on Vercel.

---

## 1. Hetzner VPS (API)

1. Create a Cloud VPS (e.g. CX22), Ubuntu 22.04+, open firewall **80/443** (and SSH).
2. Install Node 20, nginx, certbot.
3. Clone the repo and run only the server:

```bash
git clone https://github.com/fazalurrehman9511/Bpex-Pro.git
cd Bpex-Pro/server
npm ci --omit=dev
cp .env.example .env
nano .env
```

Suggested `server/.env` on Hetzner:

```env
NODE_ENV=production
PORT=3001
BIND_HOST=127.0.0.1
SERVE_FRONTEND=0
ENABLE_BPEXCH_PROXY=1
CORS_ORIGIN=https://bpexpro.com,https://www.bpexpro.com
CORS_ALLOW_VERCEL=1
API_BASE_URL=http://127.0.0.1:3001
ADMIN_USERNAME=superadmin
ADMIN_PASSWORD=...
JWT_SECRET=...
BPEXCH_SYNC_SECRET=...
BPEXCH_AGENT_USERNAME=...
BPEXCH_AGENT_PASSWORD=...
BPEXCH_HTTP_PROXY=http://USER:PASS@gw.dataimpulse.com:823
```

4. Process manager:

```bash
# example with systemd / pm2
npm start
# or: pm2 start src/index.js --name bpex-api
```

5. Point DNS **`api.bpexpro.com` → VPS IP**, then nginx TLS (see below).
6. Test:

```bash
curl -sS https://api.bpexpro.com/api/health
curl -x "$BPEXCH_HTTP_PROXY" -sS --max-time 30 https://api.ipify.org/
```

### nginx (`/etc/nginx/sites-available/api.bpexpro.com`)

```nginx
server {
    listen 80;
    server_name api.bpexpro.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bpexpro.com;

    # ssl_certificate ... (certbot)

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
```

```bash
sudo certbot --nginx -d api.bpexpro.com
```

---

## 2. Vercel (frontend)

1. Import GitHub repo `Bpex-Pro` into Vercel.
2. **Framework:** Vite (auto). **Output:** `dist`.
3. Root directory: repo root (not `server/`).
4. Env (Project Settings → Environment Variables), optional overrides:

| Name | Value |
|------|--------|
| `VITE_SITE_URL` | `https://bpexpro.com` |
| `VITE_SITE_DOMAIN` | `bpexpro.com` |
| `VITE_API_URL` | *(leave unset / empty)* |
| WhatsApp / payment `VITE_*` | as needed |

5. `vercel.json` already rewrites `/api`, `/bpexch`, `/uploads` → `https://api.bpexpro.com/...`.
6. Domains: add **`bpexpro.com`** + **`www`** to the Vercel project (DNS as Vercel instructs).
7. Deploy.

---

## 3. Cutover checklist

- [ ] `api.bpexpro.com/api/health` → `ok: true`
- [ ] DataImpulse curl from VPS prints a residential IP
- [ ] `https://bpexpro.com/` loads from Vercel
- [ ] `https://bpexpro.com/api/health` works (via rewrite)
- [ ] Admin login, deposit form, `/dashboard` embed
- [ ] Old cPanel Node can be stopped after cutover (or keep as backup)

---

## 4. Notes

- **Do not** commit `server/.env` or proxy passwords.
- Mobile APK: set `VITE_NATIVE_API_URL=https://bpexpro.com` (rewrites) or `https://api.bpexpro.com`.
- If you change API host, edit destinations in `vercel.json` and redeploy.
- cPanel-only all-in-one deploy remains documented in `deploy/cpanel.md`.
