# ProspectWeb 🔭

Outil de prospection locale pour créateurs de sites web. Identifie les commerces, restaurants et artisans autour d'une adresse qui n'ont pas de site web ou dont le site est obsolète — vos futurs clients.

**Production :** [prospectweb.vercel.app](https://prospectweb.vercel.app)

---

## Fonctionnalités

- **Recherche géolocalisée** — par adresse (autocomplétion) ou position GPS, rayon jusqu'à 50 km
- **23 types de commerces** interrogés en parallèle via Google Places API
- **Vérification des sites web** — détecte si le site répond et si son contenu est récent (< 2 ans)
- **Classement des prospects** — `Sans site` / `Site obsolète` / `Site actif`
- **Carte interactive** — marqueurs colorés par statut sur OpenStreetMap
- **Filtres** — par statut, par type de commerce, tri par pertinence / distance / note / popularité
- **Fiche détail** — coordonnées, note Google, script de prospection, onglet notes
- **CRM léger** — statuts À contacter / Contacté / En discussion / Client gagné / Pas intéressé
- **Export CSV** — liste des prospects avec toutes les infos
- **4 thèmes** — Clair, Sable, Nuit, Noir
- **Responsive** — mobile et desktop

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Backend | Express, TypeScript, Node.js |
| Carte | Leaflet.js + OpenStreetMap |
| Données | Google Places API (Nearby Search + Geocoding) |
| Vérification web | Fetch côté serveur avec analyse HTML |
| Déploiement | Vercel (frontend) + Railway (backend) |

---

## Structure du projet

```
prospectweb/
├── frontend/                  # Next.js App Router
│   └── app/
│       ├── components/        # AppHeader, SearchForm, ThemeToggle...
│       ├── hooks/             # useProspects (localStorage CRM)
│       ├── results/           # Page résultats + carte + fiches
│       └── prospects/         # Page "Mes prospects"
│
├── backend/                   # Express API
│   └── src/
│       ├── routes/            # GET /api/search
│       └── services/
│           ├── geocode.ts     # Adresse → coordonnées
│           ├── places.ts      # Google Places Nearby Search
│           └── websiteChecker.ts  # Vérification des sites web
│
├── .env                       # Clés API (ne pas commiter)
└── .env.example               # Template des variables nécessaires
```

---

## Installation locale

### Prérequis
- Node.js 20+
- Une clé Google Places API avec **Geocoding API** et **Places API (New)** activées

### 1. Cloner et configurer

```bash
git clone https://github.com/sofianehms/prospectweb.git
cd prospectweb
```

Copier le fichier d'environnement et renseigner la clé API :

```bash
cp .env.example .env
# Éditer .env et renseigner GOOGLE_PLACES_KEY
```

### 2. Lancer le backend

```bash
cd backend
npm install
npm run dev   # http://localhost:4000
```

### 3. Lancer le frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## Variables d'environnement

| Variable | Où | Description |
|----------|-----|-------------|
| `GOOGLE_PLACES_KEY` | `.env` racine | Clé Google Places API |
| `BACKEND_URL` | `frontend/.env.local` | URL du backend (`http://localhost:4000` en local) |
| `FRONTEND_URL` | `backend/.env` | URL du frontend (pour CORS) |

---

## Déploiement

Le projet est déployé automatiquement à chaque `git push` :

- **Frontend** → [Vercel](https://vercel.com) détecte le dossier `frontend/`
- **Backend** → [Railway](https://railway.app) détecte le dossier `backend/`

Variables à configurer sur chaque plateforme : voir tableau ci-dessus.

---

## Endpoints API

### `GET /api/search`

Recherche les commerces autour d'un point et vérifie leurs sites web.

**Paramètres**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `address` | string | Adresse textuelle (ou `lat` + `lng`) |
| `lat` / `lng` | number | Coordonnées GPS |
| `radius` | number | Rayon en mètres (max 50 000) |
| `type` | string | Type Google Places (optionnel) |

**Réponse**

```json
{
  "center": { "lat": 48.85, "lng": 2.35 },
  "radius": 5000,
  "summary": { "total": 142, "none": 67, "outdated": 23, "ok": 52 },
  "establishments": [
    {
      "id": "...",
      "name": "Boulangerie Dupont",
      "address": "14 rue de la Roquette, Paris",
      "type": "bakery",
      "phone": "+33 1 43 55 00 00",
      "website": null,
      "rating": 4.7,
      "ratingCount": 214,
      "mapsUrl": "https://maps.google.com/...",
      "websiteStatus": "none"
    }
  ]
}
```

`websiteStatus` : `none` | `outdated` | `ok`

---

## Crédits

- Données commerces : [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- Carte : [Leaflet.js](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org)
- Autocomplétion adresses : [Nominatim](https://nominatim.org) (OpenStreetMap)
