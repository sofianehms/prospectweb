# Nosite

Outil de prospection locale pour createurs de sites web. Identifie les commerces, restaurants et artisans autour d'une adresse qui n'ont pas de site web ou dont le site est obsolete — vos futurs clients.

**Production :** [Nosite.vercel.app](https://Nosite.vercel.app)
**Depot :** [github.com/sofianehms/Nosite](https://github.com/sofianehms/Nosite)

---

## Stack technique

| Couche | Technologie | Version | Role |
|--------|-------------|---------|------|
| Frontend | Next.js (App Router) | ^15.3.3 | Server Components, SSR, API routes |
| UI | React + Tailwind CSS v4 | 19 | Composants, themes CSS |
| Carte | Leaflet.js | 1.9 | Carte interactive, marqueurs |
| Backend | Express | 5.2.1 | API REST, middleware |
| Langage | TypeScript | 6 | Typage strict front et back |
| Base de donnees | PostgreSQL | — | Utilisateurs, prospects, compteurs |
| Cache | Redis (ioredis) | — | Cache recherche, TTL 10 min |
| Auth | JWT (jsonwebtoken) | — | Authentification utilisateur |
| Securite | helmet | — | En-tetes HTTP securises |
| API commerces | Google Places API (New) | v1 | Nearby Search |
| API geocodage | Google Geocoding API | v1 | Adresse -> coordonnees |
| Autocompletion | Nominatim (OSM) | — | Proxy backend avec User-Agent |
| Deploiement | Vercel (frontend) + Railway (backend, PostgreSQL, Redis) | — | CI/CD automatique |

---

## Variables d'environnement

### `.env` (racine — charge par le backend via dotenv)

| Variable | Description | Obligatoire |
|----------|-------------|:-----------:|
| `PORT` | Port du serveur Express (defaut: 4000) | Non |
| `FRONTEND_URL` | URL du frontend pour CORS | Oui |
| `GOOGLE_PLACES_KEY` | Cle API Google (Places + Geocoding) | Oui |
| `BACKEND_SECRET` | Secret partage front/back (`openssl rand -hex 32`) | Oui |
| `JWT_SECRET` | Secret JWT pour l'auth (`openssl rand -hex 32`) | Oui |
| `GOOGLE_DAILY_LIMIT` | Plafond d'appels Google/jour (defaut: 500) | Non |
| `USER_DAILY_LIMIT` | Plafond par utilisateur/jour (defaut: 100) | Non |
| `DATABASE_URL` | URL PostgreSQL (requis en prod) | Prod |
| `REDIS_URL` | URL Redis (requis en prod, fallback in-memory en dev) | Prod |

### `frontend/.env.local`

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | URL du backend (ex: `http://localhost:4000`) |
| `BACKEND_SECRET` | Meme valeur que dans `.env` racine |

### Variables sur les plateformes de deploiement

| Variable | Vercel (frontend) | Railway (backend) |
|----------|:-----------------:|:-----------------:|
| `GOOGLE_PLACES_KEY` | — | Oui |
| `BACKEND_SECRET` | Oui | Oui |
| `BACKEND_URL` | Oui (URL Railway) | — |
| `FRONTEND_URL` | — | Oui (URL Vercel) |
| `JWT_SECRET` | — | Oui |
| `DATABASE_URL` | — | Oui (ref. service PostgreSQL) |
| `REDIS_URL` | — | Oui (ref. service Redis) |

---

## Installation locale

### Prerequis

- Node.js 20+
- Une **cle Google Cloud API** avec : Places API (New) + Geocoding API
- (Optionnel) Docker pour PostgreSQL et Redis locaux

### 1. Cloner et configurer

```bash
git clone https://github.com/sofianehms/Nosite.git
cd Nosite
cp .env.example .env
```

Editer `.env` et remplir au minimum `GOOGLE_PLACES_KEY`, `BACKEND_SECRET` et `JWT_SECRET`.

Creer `frontend/.env.local` :
```env
BACKEND_URL=http://localhost:4000
BACKEND_SECRET=meme_valeur_que_dans_env
```

### 2. (Optionnel) PostgreSQL et Redis locaux

```bash
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
docker run -d --name redis -p 6379:6379 redis
```

Ajouter dans `.env` :
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
REDIS_URL=redis://localhost:6379
```

Sans ces variables, le backend fonctionne avec un cache en memoire et les utilisateurs en fichier JSON (dev uniquement).

### 3. Lancer le backend

```bash
cd backend
npm install
npm run dev     # Express sur http://localhost:4000
```

### 4. Lancer le frontend

```bash
cd frontend
npm install
npm run dev     # Next.js sur http://localhost:3000
```

### 5. Verifier

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

---

## API du backend

| Methode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/health` | — | Health check |
| POST | `/api/auth/register` | — | Creer un compte |
| POST | `/api/auth/login` | — | Se connecter |
| GET | `/api/auth/me` | JWT | Info utilisateur |
| DELETE | `/api/auth/me` | JWT | Supprimer son compte (RGPD) |
| GET | `/api/search` | Secret + JWT | Rechercher des commerces |
| GET | `/api/autocomplete?q=` | Secret | Autocompletion Nominatim |
| GET | `/api/establishment/:id` | Secret + JWT | Fiche d'un etablissement (cache) |
| GET | `/api/prospects` | Secret + JWT | Lister ses prospects |
| POST | `/api/prospects` | Secret + JWT | Ajouter un prospect |
| DELETE | `/api/prospects/:id` | Secret + JWT | Supprimer un prospect |
| PATCH | `/api/prospects/:id/status` | Secret + JWT | Modifier le statut CRM |
| PATCH | `/api/prospects/:id/notes` | Secret + JWT | Modifier les notes |
| GET | `/api/usage` | — | Usage global Google |
| GET | `/api/usage/me` | JWT | Usage personnel |

---

## Modeles de donnees

### Establishment

```typescript
interface Establishment {
  id: string                // Google Place ID
  name: string
  address: string
  lat: number
  lng: number
  type: string              // ex: "bakery", "restaurant"
  phone: string | null
  website: string | null
  mapsUrl: string
  rating: number | null
  ratingCount: number | null
  websiteStatus: 'none' | 'unreachable' | 'outdated' | 'active'
  confidenceScore: number   // 0-100, score de recence pondere
}
```

### Prospect (PostgreSQL)

```typescript
interface Prospect {
  id: string                // Google Place ID
  userId: string
  name: string
  address: string
  type: string
  phone: string | null
  mapsUrl: string
  rating: number | null
  ratingCount: number | null
  websiteStatus: string
  crmStatus: 'to_contact' | 'contacted' | 'discussing' | 'won' | 'lost'
  notes: string
  addedAt: string
  cachedAt: string          // Fraicheur des donnees Google (max 30j)
  stale: boolean
}
```

---

## Schema de la base de donnees

Tables creees automatiquement au demarrage (`initDb()`) :

- **users** : id, email, password_hash, created_at
- **prospects** : id, user_id, name, address, type, phone, maps_url, rating, rating_count, website_status, crm_status, notes, added_at, cached_at
- **user_usage** : user_id, date, calls
- **google_usage** : date, places, geocoding

---

## Deploiement (Railway + Vercel)

### Backend sur Railway

1. Nouveau projet > "Deploy from GitHub repo"
2. Root directory : `backend`
3. Ajouter un service **PostgreSQL** et un service **Redis**
4. Lier `DATABASE_URL` et `REDIS_URL` depuis les services
5. Configurer les variables : `GOOGLE_PLACES_KEY`, `BACKEND_SECRET`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend sur Vercel

1. Importer le depot > Root directory : `frontend`
2. Configurer : `BACKEND_URL` (URL Railway), `BACKEND_SECRET`

---

## Credits

- Donnees commerces : [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- Carte : [Leaflet.js](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org)
- Autocompletion adresses : [Nominatim](https://nominatim.org) (OpenStreetMap)
