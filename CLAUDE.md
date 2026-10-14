# Nosite — Documentation Développement

Outil de prospection locale pour createurs de sites web. Identifie les commerces, restaurants et artisans sans site web autour d'une adresse.

**Production:** [nosite.fr](https://www.nosite.fr)  
**Repo:** [github.com/sofianehms/prospectweb](https://github.com/sofianehms/prospectweb)

---

## Architecture

```
prospectweb/
├── backend/              Express + TypeScript
│   ├── src/
│   │   ├── index.ts      Main app + routes setup
│   │   ├── routes/       API endpoints
│   │   ├── services/     Business logic (Google API, auth, quotas, etc.)
│   │   ├── middleware/   requireAuth, error handling
│   │   └── __tests__/    Tests (vitest, excluded from build)
│   └── tsconfig.json     excludes __tests__ from build
│
├── frontend/             Next.js 15 App Router + React 19 + Tailwind
│   ├── app/
│   │   ├── page.tsx      Landing page
│   │   ├── layout.tsx    Root layout (Clerk, Sentry, theme)
│   │   ├── search/       Search form + map
│   │   ├── results/      Search results
│   │   ├── prospects/    CRM dashboard
│   │   ├── dashboard/    User dashboard + KPIs
│   │   ├── api/          Next.js API routes (proxy to backend)
│   │   └── components/   Reusable UI components
│   └── globals.css       Tailwind + CSS variables
│
└── .env.example          Environment template
```

## Setup Local

### 1. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure `.env` (root)
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
GOOGLE_PLACES_KEY=<your-key>
BACKEND_SECRET=<openssl rand -hex 32>
JWT_SECRET=<openssl rand -hex 32>
GOOGLE_DAILY_LIMIT=500
USER_DAILY_LIMIT=100
```

### 3. Create `frontend/.env.local`
```env
BACKEND_URL=http://localhost:4000
BACKEND_SECRET=<same-as-above>
```

### 4. Run servers
```bash
# Terminal 1: Backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2: Frontend (http://localhost:3000)
cd frontend && npm run dev
```

### 5. Verify
```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

---

## Build & Deploy

### Build
```bash
cd backend && npm run build    # TypeScript → dist/
cd ../frontend && npm run build # Next.js optimized build
```

### Test Backend
```bash
cd backend && npm test  # vitest run
```

### Lint
```bash
cd frontend && npm run lint  # ESLint only
```

### Deploy
- **Frontend:** Vercel (auto-deploy on main)
- **Backend:** Railway (auto-deploy on main, requires env vars)

---

## Key Technologies

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Next.js 15, React 19, Tailwind v4 | App Router, Server Components |
| Backend | Express 5, TypeScript 6 | Nodemon for hot reload |
| Auth | Clerk + JWT | Legacy JWT for migration period |
| Database | PostgreSQL | User accounts, prospects, usage |
| Cache | Redis (ioredis) | Google API cache (TTL 10min) |
| External APIs | Google Places, Geocoding, Nominatim | For business data |
| Payment | Stripe | Webhooks for subscriptions |
| Monitoring | Sentry | Error tracking (both frontend/backend) |
| Maps | Leaflet.js | Interactive map + OpenStreetMap |

---

## API Endpoints (Backend)

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` (JWT) — Current user info
- `DELETE /api/auth/me` (JWT) — Delete account (RGPD)

### Search & Data
- `GET /api/search?address=...&radius=...&types=...` (Secret + JWT) — Find businesses
- `GET /api/autocomplete?q=...` (Secret) — Address autocomplete (Nominatim)
- `GET /api/establishment/:id` (Secret + JWT) — Business details (cached)

### Prospects (CRM)
- `GET /api/prospects` (Secret + JWT) — List user prospects
- `POST /api/prospects` (Secret + JWT) — Save prospect
- `DELETE /api/prospects/:id` (Secret + JWT) — Remove prospect
- `PATCH /api/prospects/:id/status` (Secret + JWT) — Update CRM status
- `PATCH /api/prospects/:id/notes` (Secret + JWT) — Update notes

### Usage & Billing
- `GET /api/usage` — Global Google API usage
- `GET /api/usage/me` (JWT) — User's daily usage
- `GET /api/plans/me` (JWT) — User's plan info
- `POST /api/billing/webhook` — Stripe webhooks

### Health
- `GET /health` — Health check

---

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types without explanation
- Import over require
- Use ES modules (import/export)

### React/Next.js
- Server Components by default (unless `'use client'` needed)
- Functional components with hooks
- Inline styles preferred (over CSS files) for component-specific styles
- CSS variables for theme (dark/light mode)

### Git
- Branch: `claude/repo-setup-gdrw0x` (development)
- Commit messages: clear, imperative ("fix: ...", "feat: ...", "docs: ...")
- No attributed commits to Claude (removed from settings)

---

## Common Tasks

### Add a new API endpoint
1. Create route file in `backend/src/routes/<name>.ts`
2. Export router with `export default router`
3. Import and register in `backend/src/index.ts`
4. Add TypeScript types if needed
5. Test with curl or Postman

### Modify database schema
1. Edit schema in relevant service file (e.g., `userQuota.ts`)
2. Update SQL migration or run `initDb()` (creates tables on startup)
3. Add corresponding TypeScript types

### Deploy changes
```bash
git add . && git commit -m "..."
git push -u origin claude/repo-setup-gdrw0x
# Creates/updates PR → auto-deploy on merge
```

### Debug Frontend
- Open DevTools → Console for errors
- Check Network tab for API responses
- Use React DevTools for component inspection
- Sentry auto-captures errors

### Debug Backend
- Check console output in terminal
- Use `console.log()` or add logging
- Check Sentry for production errors
- Enable more verbose logs via `DEBUG=*`

---

## Known Limitations & TODOs

- Redis required for prod (in-memory fallback dev-only)
- PostgreSQL required for prod (file-based fallback dev-only)
- Stripe webhooks require public URL (use ngrok for local testing)
- Tests in backend excluded from build (run with `npm test` separately)

---

## Troubleshooting

### Backend build fails with TypeScript errors
- Check that tests are excluded: `tsconfig.json` has `exclude: ["src/__tests__"]`
- Ensure `@types/node` is installed: `npm ls @types/node`
- Run `npm install` if dependencies are missing

### Frontend won't compile
- Clear Next.js cache: `rm -rf .next`
- Check that `BACKEND_URL` is set in `frontend/.env.local`
- Verify no syntax errors: `npm run lint`

### API calls return 401/403
- Check JWT token in browser cookies
- Verify `BACKEND_SECRET` matches between `.env` and `frontend/.env.local`
- Ensure user is authenticated (logged in)

### Google API quota exceeded
- Check `GOOGLE_DAILY_LIMIT` in `.env` (default: 500/day)
- Review `GOOGLE_PLACES_KEY` validity
- Check usage: `GET /api/usage`

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Clerk Docs](https://clerk.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Leaflet.js](https://leafletjs.com/reference.html)

---

**Last Updated:** 2026-10-14  
**Status:** ✓ Builds passing, dev servers ready
