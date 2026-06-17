# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Domain + reverse proxy (Nginx/Caddy) recommended for HTTPS
- MySQL 8.4+ and Redis 7+ (included in compose)

## 1. Configure secrets

```bash
cp .env.production.example .env.production
# Edit all CHANGE-ME values — especially JWT_SECRET (32+ chars)
```

Generate a strong JWT secret:

```bash
openssl rand -base64 48
```

## 2. Build & run (production)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Services:

| Service  | Port | Notes                          |
|----------|------|--------------------------------|
| Frontend | 3000 | Next.js standalone             |
| Backend  | 4000 | API prefix `/api/v1`           |
| MySQL    | —    | Internal network only          |
| Redis    | —    | Internal network only          |

Health check: `GET http://localhost:4000/api/v1/health`

## 3. Seed data (first deploy)

```bash
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

Default admin: `admin@clothingstore.com` / `Admin@123` — **change immediately in production**.

## 4. Reverse proxy (recommended)

Terminate TLS at Nginx/Caddy and proxy:

- `https://your-domain.com` → `frontend:3000`
- `https://api.your-domain.com` → `backend:4000`

Set `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` to your public URLs.

## 5. Security checklist

- [ ] Strong `JWT_SECRET` (32+ characters)
- [ ] Unique MySQL/Redis passwords
- [ ] `NODE_ENV=production` (disables Swagger)
- [ ] HTTPS only in production
- [ ] Firewall: expose only 80/443, not 3306/6379
- [ ] Change default admin password after seed
- [ ] Review CORS `FRONTEND_URL` matches your domain exactly

## 6. Manual deploy (without Docker)

### Backend

```bash
cd backend
cp ../.env.example .env
npm ci
npm run build
npm run db:push
npm run db:seed
npm run start:prod
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local  # set NEXT_PUBLIC_* URLs
npm ci
npm run build
npm run start
```

## 7. Updates

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
