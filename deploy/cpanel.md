# BpxPro — Production Deploy (cPanel + Setup Node.js App)

Server: Apache (cPanel) → Node.js App (Express serves API + Vite `dist` + `/bpexch` proxy)

## 1. Prepare locally

```bash
# From repo root
cp .env.example .env
cp server/.env.example server/.env
# Edit both files — set strong ADMIN_PASSWORD, JWT_SECRET, BPEXCH_SYNC_SECRET
# Keep BPEXCH_SYNC_SECRET identical in root .env and server/.env

npm ci
npm run build

cd server && npm ci && cd ..
```

## 2. Upload to cPanel

Upload the whole project (or git clone via SSH) so structure looks like:

```
~/bpexpro/                 ← Application root
  dist/                    ← from npm run build
  server/
    src/
    package.json
    .env                   ← production secrets (never commit)
    node_modules/          ← run npm ci on server if possible
  src/                     ← needed for BPEXCH proxy rewrites
  vite-plugin-bpexch-proxy.js
  package.json
```

Do **not** upload root `node_modules` if disk is tight — only `server/node_modules` is required at runtime. Frontend is already compiled into `dist/`.

## 3. Create Node.js App (cPanel)

1. **Software → Setup Node.js App → Create Application**
2. **Node.js version:** 20.x (or latest LTS available)
3. **Application mode:** Production
4. **Application root:** `bpexpro` (folder that contains `server/` and `dist/`)
5. **Application URL:** your domain (e.g. `bpexpro.com` or subdomain)
6. **Application startup file:** `server/src/index.js`
7. Click **Create** then open **Environment variables** and set:

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `PORT` | *(cPanel often sets this automatically — leave or match)* |
| `ADMIN_USERNAME` | `superadmin` |
| `ADMIN_PASSWORD` | *(long random)* |
| `JWT_SECRET` | *(32+ random chars)* |
| `BPEXCH_SYNC_SECRET` | *(16+ random chars)* |
| `CORS_ORIGIN` | `https://bpexpro.com,https://www.bpexpro.com` |
| `API_BASE_URL` | `http://127.0.0.1:PORT` *(use the same PORT cPanel assigns)* |
| `DATABASE_PATH` | `./data/flowexch.db` |
| `UPLOADS_DIR` | `./uploads` |
| `ENABLE_BPEXCH_PROXY` | `1` |
| `BPEXCH_AGENT_USERNAME` | *(agent account)* |
| `BPEXCH_AGENT_PASSWORD` | *(agent password)* |
| `BPEXCH_LIVE_USERNAME` | *(optional)* |
| `BPEXCH_LIVE_PASSWORD` | *(optional)* |

You can put the same values in `server/.env` instead of the cPanel UI (or both — process env wins if set in UI).

8. Open the app’s terminal / SSH in application root and run:

```bash
cd server
npm ci --omit=dev
```

`better-sqlite3` needs a native build — CloudLinux Node selector usually compiles it. If install fails, enable **Compiler Access** or ask host support for `node-gyp` / build tools.

9. **Restart** the Node.js application.

## 4. SSL

cPanel → **SSL/TLS Status** → AutoSSL / Let’s Encrypt for your domain. Force HTTPS redirect.

## 5. Verify

- `https://your-domain.com/api/health` → `{"ok":true,...}`
- `https://your-domain.com/` → homepage
- `https://your-domain.com/admin` → admin UI
- Login / register / deposit smoke test

## 6. Updates (after `git pull`)

```bash
npm ci
npm run build
cd server && npm ci --omit=dev && cd ..
# Restart Node.js App from cPanel
```

## 7. Backups

Daily (or before each deploy) copy:

- `server/data/flowexch.db`
- `server/uploads/`

## Notes

- Node serves the SPA, `/api/*`, `/uploads/*`, and `/bpexch/*` — no separate nginx required on cPanel.
- Keep `VITE_API_URL` empty for same-domain production builds.
- Production refuses to start if `ADMIN_PASSWORD`, `JWT_SECRET`, or `BPEXCH_SYNC_SECRET` are weak/missing.

## 8. BPEXCH Cloudflare + residential proxy (cookbook)

### Problem
Hosting datacenter IP hits Cloudflare **403** on `bpexch.xyz`. Dashboard embed (`/bpexch` → iframe on `bpexpro.com/dashboard`), admin sync, and cash-on-approve all need a clean exit IP.

### Config (already in app)
In `server/.env` on the server:

```env
BPEXCH_HTTP_PROXY=http://USER:PASS@gw.dataimpulse.com:823
```

Sticky sessions often use port `10000`. Code path: `server/src/services/bpexchHttp.js`.

### Why proxy looks “unused”
Many cPanel hosts **block outbound** non-standard ports. Test from the server:

```bash
curl -x "http://USER:PASS@gw.dataimpulse.com:823" -sS --max-time 30 https://api.ipify.org/
```

- **Connection refused** → ask host to allow outbound TCP to `gw.dataimpulse.com` ports **823**, **824**, **10000–20000** (outbound only).
- **Prints an IP** → restart Node; BPEXCH calls should go through residential.

Sample support ask: allow outbound only (not inbound) to DataImpulse gateway for API/proxy use (`bpexpro.com` / cPanel user).

### After ports open
```bash
pkill -9 -f "src/index.js" || true
source /home/bpexproc/nodevenv/repositories/Bpex-Pro/server/20/bin/activate
cd ~/repositories/Bpex-Pro/server
nohup env NODE_ENV=production PORT=3001 node src/index.js > ~/logs/bpex-node.log 2>&1 &
```

Do **not** put proxy secrets in git. Until outbound works, use PC sync scripts or a VPS that allows port 823.
