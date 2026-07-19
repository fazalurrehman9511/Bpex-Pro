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

## Deploy (cPanel)

See **[deploy/cpanel.md](./deploy/cpanel.md)** for step-by-step Setup Node.js App instructions.

## Optional: nginx (VPS)

If you use nginx instead of cPanel Node routing, see `nginx.conf.example` for `/bpexch`, `/api`, and SPA `try_files` snippets. Set `ENABLE_BPEXCH_PROXY=0` on the Node app if nginx already proxies `/bpexch/`.

## Security checklist (production)

- Strong `ADMIN_PASSWORD` (12+ chars)
- Unique `JWT_SECRET` (32+ chars)
- Unique `BPEXCH_SYNC_SECRET` (16+ chars) — never leave empty
- `CORS_ORIGIN` limited to your HTTPS domains
- Never commit `.env` or `server/.env`
- Backup `server/data/` and `server/uploads/` regularly
