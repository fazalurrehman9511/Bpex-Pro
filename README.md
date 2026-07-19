# BpxPro

Production stack: **Vite/React frontend** + **Express API** (SQLite) + **BPEXCH embed proxy**.

## Local development

```bash
cp .env.example .env
cp server/.env.example server/.env
# Edit secrets in both files

npm install
cd server && npm install && cd ..

npm run dev:all
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

## Production build

```bash
npm run build
cd server && NODE_ENV=production npm start
```

Express serves `dist/`, `/api`, `/uploads`, and `/bpexch` when `dist/` exists.

## Deploy (recommended: Vercel + Hetzner)

See **[deploy/vercel-hetzner.md](./deploy/vercel-hetzner.md)**:

- Frontend → Vercel (`bpexpro.com`)
- API + `/bpexch` + DataImpulse → Hetzner (`api.bpexpro.com`)
- Vercel rewrites keep `/api` and `/bpexch` same-origin for the browser

## Deploy (cPanel all-in-one)

See **[deploy/cpanel.md](./deploy/cpanel.md)** for Setup Node.js App on shared hosting.

## Optional: nginx (VPS)

If you use nginx instead of cPanel Node routing, see `nginx.conf.example` for `/bpexch`, `/api`, and SPA `try_files` snippets. Set `ENABLE_BPEXCH_PROXY=0` on the Node app if nginx already proxies `/bpexch/`. For the Vercel + `api.*` layout, use the nginx snippet in `deploy/vercel-hetzner.md`.

## Security checklist (production)

- Strong `ADMIN_PASSWORD` (12+ chars)
- Unique `JWT_SECRET` (32+ chars)
- Unique `BPEXCH_SYNC_SECRET` (16+ chars) — never leave empty
- `CORS_ORIGIN` limited to your HTTPS domains
- Never commit `.env` or `server/.env`
- Backup `server/data/` and `server/uploads/` regularly
