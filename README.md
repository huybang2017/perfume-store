# Clothing Store

Enterprise e-commerce platform for clothing retail — feature-based NestJS API + Next.js 15 storefront and admin dashboard.

## Architecture

- **Backend**: NestJS, Drizzle ORM, PostgreSQL, JWT/Passport, Redis cache, Socket.IO, Swagger
- **Frontend**: Next.js 15 App Router, Redux Toolkit + RTK Query, Shadcn UI, TailwindCSS
- **Pattern**: Controller → Service → Repository → Drizzle (no direct DB access in controllers)

```
clothing-store/
├── backend/          # NestJS API
├── frontend/         # Next.js web app
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (optional, for PostgreSQL + Redis)

### 1. Infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
cp ../.env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

API: http://localhost:4000/api/v1  
Swagger: http://localhost:4000/api/docs

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The storefront calls `/api/v1` on the Next.js dev server, which proxies to the Nest API at `http://localhost:4000` (see `frontend/next.config.ts`).

**Run API + web together** (from repo root, after `npm install`):

```bash
npm run dev
```

Store: http://localhost:3000  
Admin: http://localhost:3000/admin

### API smoke test

With the backend running:

```bash
npm run test:api
```

Runs 53 checks against every REST endpoint (public, customer, admin).

## Default Admin

After seeding:

- Email: `admin@clothingstore.com`
- Password: `Admin@123`

## Module Overview

| Backend Module   | Description                    |
|------------------|--------------------------------|
| auth             | JWT login/register             |
| users            | User management                |
| products         | Product catalog                |
| categories       | Category tree                  |
| brands           | Brand management               |
| inventories      | Stock tracking                 |
| carts            | Shopping cart                  |
| orders           | Order lifecycle                |
| vouchers         | Discount codes                 |
| reviews          | Product reviews                |
| notifications    | Push/in-app notifications      |
| chat             | Real-time customer support     |
| dashboard        | Admin analytics                |
| settings         | Store configuration            |

### Cart / Order / Voucher API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/carts` | Current user cart |
| POST | `/carts/items` | Add item `{ productId, quantity }` |
| PATCH | `/carts/items/:itemId` | Update quantity |
| DELETE | `/carts/items/:itemId` | Remove item |
| DELETE | `/carts` | Clear cart |
| POST | `/orders/checkout` | Place order from cart |
| GET | `/orders` | List orders (own / all for admin) |
| GET | `/orders/:id` | Order detail + items |
| PATCH | `/orders/:id/status` | Update status (admin) |
| POST | `/orders/:id/cancel` | Cancel order + restore stock |
| POST | `/vouchers/validate` | Validate voucher (public) |
| GET/POST/PATCH/DELETE | `/vouchers` | CRUD (admin) |

## Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker production setup, security checklist, and reverse proxy notes.

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Security

- Helmet HTTP headers, rate limiting (Throttler), Joi env validation
- JWT required (32+ char secret), Swagger disabled in production
- Socket.IO authenticated via JWT (no client-spoofed sender)
- CORS restricted to `FRONTEND_URL`

## License

Private — all rights reserved.
