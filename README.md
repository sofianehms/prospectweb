# ProspectWeb

Outil de prospection locale pour créateurs de sites web. Identifie les commerces, restaurants et artisans autour d'une adresse qui n'ont pas de site web ou dont le site est obsolète — vos futurs clients.

**Production :** [prospectweb.vercel.app](https://prospectweb.vercel.app)  
**Dépôt :** [github.com/sofianehms/prospectweb](https://github.com/sofianehms/prospectweb)

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Fonctionnalités](#fonctionnalités)
3. [Architecture](#architecture)
4. [Traitement d'une requête de A à Z](#traitement-dune-requête-de-a-à-z)
5. [Algorithmes détaillés](#algorithmes-détaillés)
6. [API du backend](#api-du-backend)
7. [Modèles de données](#modèles-de-données)
8. [Variables d'environnement](#variables-denvironnement)
9. [Installation locale](#installation-locale)
10. [Déploiement](#déploiement)
11. [Stack technique](#stack-technique)
12. [Crédits](#crédits)

---

## Vue d'ensemble

ProspectWeb répond à un problème concret pour les freelances et agences web : **trouver des clients potentiels locaux**. La plupart des petits commerces de proximité n'ont pas de site web ou ont un site vieux de 5 ans. Cet outil automatise la recherche et la qualification de ces prospects.

### Ce que fait l'application

1. L'utilisateur saisit une adresse et un rayon (ex. "Lyon, 3 km")
2. L'application interroge Google Places pour trouver tous les commerces de la zone
3. Pour chaque commerce, elle tente de joindre son site web et analyse si le contenu est récent
4. Elle affiche les résultats sur une carte et dans une liste, triés et filtrables
5. L'utilisateur peut sauvegarder des prospects, suivre leur avancement (CRM) et exporter en CSV

---

## Fonctionnalités

### Recherche

- **Adresse avec autocomplétion** — l'utilisateur tape une adresse, des suggestions apparaissent via Nominatim (OpenStreetMap), sans quota
- **Géolocalisation GPS** — bouton pour utiliser la position actuelle du navigateur
- **Rayon ajustable** — de 1 à 10 km, modifiable aussi depuis la page résultats (relance la recherche)
- **Sélection de types de commerces** — jusqu'à 23 catégories (restaurant, boulangerie, pharmacie, coiffeur...) sélectionnables individuellement en page d'accueil; si aucun type n'est sélectionné, tous sont interrogés

### Résultats

- **Carte interactive** (Leaflet + OpenStreetMap) avec marqueurs colorés :
  - Vert = site web actif
  - Ambre = site obsolète ou inaccessible
  - Orange = pas de site web
  - Cercle bleu = rayon de recherche
- **Liste paginée** avec 10 résultats par page, bouton "Charger plus"
- **Filtres par statut** (Sans site / Site obsolète / Site actif), multi-select
- **Tri** par pertinence, distance, note Google, nombre d'avis, ordre alphabétique
- **Compteurs** par statut en haut des résultats

### Fiche prospect

- Coordonnées complètes (adresse, téléphone, note et nombre d'avis Google)
- Boutons d'action : Appeler, Envoyer un email, Itinéraire Google Maps
- **Script de prospection** généré automatiquement selon le statut du site web
- Onglet **Notes** pour saisir des observations personnelles

### CRM (gestion des prospects)

- Statuts : À contacter → Contacté → En discussion → Client gagné / Pas intéressé
- Stockage local dans le navigateur (`localStorage`) — aucune base de données serveur nécessaire
- Page dédiée "Mes prospects" listant tous les contacts sauvegardés
- **Export CSV** avec toutes les informations pour traitement externe

### Interface

- **4 thèmes** : Sable (chaud clair), Violet (clair), Minuit (sombre), Cosmos (sombre bleu)
- Thème persisté par cookie (`pw_theme`)
- Responsive mobile et desktop

---

## Architecture

```
prospectweb/
├── frontend/                          # Next.js 16, App Router
│   ├── app/
│   │   ├── page.tsx                   # Accueil — formulaire de recherche
│   │   ├── layout.tsx                 # Layout racine, gestion du thème
│   │   ├── globals.css                # Variables CSS des 4 thèmes
│   │   ├── results/
│   │   │   ├── page.tsx               # Page résultats (Server Component — appel backend)
│   │   │   └── components/
│   │   │       ├── ResultsClient.tsx  # Liste, filtres, CRM (Client Component)
│   │   │       ├── Map.tsx            # Carte Leaflet (Client Component)
│   │   │       ├── MapWrapper.tsx     # Import dynamique (SSR: false)
│   │   │       └── RadiusSlider.tsx   # Slider rayon (recharge résultats)
│   │   ├── results/[id]/
│   │   │   ├── page.tsx               # Page détail prospect
│   │   │   └── components/
│   │   │       └── DetailClient.tsx   # Fiche détail, CRM, script
│   │   ├── prospects/
│   │   │   └── page.tsx               # Page "Mes prospects"
│   │   ├── components/
│   │   │   ├── AppHeader.tsx          # En-tête + navigation
│   │   │   ├── SearchForm.tsx         # Formulaire recherche + autocomplétion
│   │   │   └── ThemeToggle.tsx        # Sélecteur de thème (4 options)
│   │   ├── hooks/
│   │   │   └── useProspects.ts        # État CRM — localStorage
│   │   └── types/
│   │       └── establishment.ts       # Interfaces TypeScript
│   ├── .env.local                     # BACKEND_URL, BACKEND_SECRET
│   └── package.json
│
├── backend/                           # Express 5, Node.js
│   └── src/
│       ├── index.ts                   # Serveur Express, CORS, routes
│       ├── routes/
│       │   └── search.ts              # GET /api/search
│       ├── services/
│       │   ├── places.ts              # Google Places — recherche multi-zone
│       │   ├── geocode.ts             # Adresse → coordonnées GPS
│       │   ├── websiteChecker.ts      # Vérification + analyse des sites web
│       │   └── cache.ts               # Cache mémoire TTL 10 min
│       └── middleware/
│           ├── auth.ts                # Validation du secret interne
│           └── rateLimit.ts           # 20 req/min
│   ├── .env                           # PORT, FRONTEND_URL
│   └── package.json
│
├── .env                               # GOOGLE_PLACES_KEY, BACKEND_SECRET (racine)
└── .env.example                       # Template des variables
```

### Séparation frontend / backend

Le frontend (Next.js) tourne sur **Vercel** et le backend (Express) tourne sur **Railway**. Cette séparation est nécessaire parce que :

- Les appels à Google Places et la vérification des sites web doivent se faire côté serveur (clé API non exposée, requêtes CORS non bloquées)
- Next.js Server Components appellent le backend via HTTP avec un secret partagé (`BACKEND_SECRET`), ce qui évite d'exposer l'endpoint à des tiers

---

## Traitement d'une requête de A à Z

Voici ce qui se passe quand un utilisateur lance une recherche "Boulangeries à Lyon, rayon 3 km" :

### Étape 1 — Saisie utilisateur (frontend, `SearchForm.tsx`)

1. L'utilisateur tape "Lyon" dans le champ adresse
2. `SearchForm` envoie une requête à **Nominatim** (`nominatim.openstreetmap.org/search?q=Lyon&format=json&limit=6`) et affiche les suggestions
3. L'utilisateur sélectionne "Lyon, Métropole de Lyon, Auvergne-Rhône-Alpes, France" → les coordonnées `lat=45.7484`, `lng=4.8467` sont stockées
4. Il choisit "Boulangerie" dans le sélecteur de types, et "3 km" sur le slider
5. Il clique sur "Rechercher" → navigation vers `/results?lat=45.7484&lng=4.8467&radius=3000&types=bakery`

### Étape 2 — Page résultats (frontend, `results/page.tsx`)

La page résultats est un **Server Component** Next.js. Avant de rendre le HTML, le serveur Vercel :

1. Lit les paramètres d'URL (`lat`, `lng`, `radius`, `types`)
2. Appelle `fetchResults()` qui envoie une requête HTTP au backend Railway :

```
GET https://[backend-railway-url]/api/search?lat=45.7484&lng=4.8467&radius=3000&types=bakery
Headers:
  x-internal-secret: [BACKEND_SECRET]
```

3. Attend la réponse JSON complète (tous les établissements avec statuts de site)
4. Passe les données aux composants client via props

### Étape 3 — Backend : validation et cache (`routes/search.ts`)

Le backend Express reçoit la requête et :

1. **Vérifie le middleware auth** — compare le header `x-internal-secret` au `BACKEND_SECRET` configuré → 401 si absent ou incorrect
2. **Vérifie le rate limit** — 20 requêtes par minute par IP → 429 si dépassé
3. **Valide les paramètres** — radius entre 1 et 10 000 mètres, lat/lng ou address requis
4. **Géocode si nécessaire** — si `address` est fourni sans coordonnées GPS, appelle `geocodeAddress()` qui interroge l'API Google Geocoding et retourne `{lat, lng}`
5. **Génère une clé de cache** — `lat=45.748&lng=4.846&radius=3000&types=bakery` (lat/lng arrondis à 3 décimales, types triés alphabétiquement)
6. **Vérifie le cache en mémoire** — si une entrée existe et a moins de 10 minutes, retourne directement le résultat → fin de traitement
7. **Sinon, lance la recherche complète**

### Étape 4 — Recherche Google Places (`services/places.ts`)

Comme Google Places API Nearby Search ne retourne **que 20 résultats par requête**, l'application contourne cette limite via une stratégie multi-zones.

**Pour chaque type sélectionné** (ici `bakery`) :

1. `subCenters()` génère 5 points de recherche à partir du centre :
   - Centre original : `(45.7484, 4.8467)`
   - Nord : `(45.7619, 4.8467)` — décalage de `radius × 0.5 = 1500m`
   - Sud : `(45.7349, 4.8467)`
   - Est : `(45.7484, 4.8660)`
   - Ouest : `(45.7484, 4.8274)`

2. Pour chacun des 5 points, `fetchByType()` envoie une requête POST à l'API Google Places :
```
POST https://places.googleapis.com/v1/places:searchNearby
Headers:
  x-goog-api-key: [GOOGLE_PLACES_KEY]
  X-Goog-FieldMask: places.id,places.displayName,...
Body:
{
  "maxResultCount": 20,
  "includedTypes": ["bakery"],
  "locationRestriction": {
    "circle": { "center": { "latitude": 45.7484, "longitude": 4.8467 }, "radiusMeters": 3000 }
  }
}
```

3. Les 5 appels partent **en parallèle** (`Promise.all`)
4. Les résultats sont fusionnés et **dédupliqués par `place.id`** — un même commerce découvert depuis plusieurs sous-centres n'apparaît qu'une fois
5. Résultat : jusqu'à **100 résultats par type** (5 × 20) au lieu de 20

**Si aucun type n'est sélectionné** : un seul appel par type parmi les 23 types commerciaux depuis le centre unique (jusqu'à 23 × 20 = 460 résultats).

### Étape 5 — Vérification des sites web (`services/websiteChecker.ts`)

Pour **chaque établissement** retourné par Google Places, le backend tente de vérifier son site web. Ces vérifications partent toutes **en parallèle** (`Promise.all`) avec un timeout de 6 secondes.

**Si l'établissement n'a pas de site web dans Google Places :**
- `websiteStatus = "none"` — sans site, prospect prioritaire

**Si l'établissement a une URL :**

1. Normalise l'URL (ajoute `https://` si absent)
2. Envoie une requête HTTP avec un User-Agent navigateur standard, suit les redirections
3. Lit les **50 premiers Ko** de la réponse HTML (optimisation mémoire — pas besoin de la page entière)
4. Analyse le contenu via `detectRecentContent()` selon 5 stratégies dans l'ordre :
   - **En-tête HTTP `Last-Modified`** — date fournie par le serveur web
   - **Balises meta** — `<meta name="last-modified">`, `modified_time`, `updated_time`
   - **JSON-LD** — `"dateModified"` ou `"datePublished"` dans les données structurées
   - **Balise `<time>`** — `<time datetime="2024-...">`
   - **Texte brut** — présence de l'année en cours ou de l'année précédente dans le HTML
5. Un site est considéré **récent** si une date < 2 ans (730 jours) est trouvée

**Résultat :**
- Site inaccessible (timeout, erreur 5xx) → `websiteStatus = "outdated"`
- Site accessible mais aucune date récente trouvée → `websiteStatus = "outdated"`
- Site accessible et contenu récent → `websiteStatus = "ok"`

### Étape 6 — Réponse et mise en cache

1. Le backend calcule le résumé (`total`, `none`, `outdated`, `ok`)
2. Met en cache le résultat complet pendant 10 minutes
3. Retourne le JSON au frontend Vercel

### Étape 7 — Affichage (frontend, `ResultsClient.tsx` + `Map.tsx`)

1. La page résultats stocke les données en `sessionStorage` (`pw_search_results`) pour les transmettre à la page de détail sans refaire d'appel
2. La carte Leaflet s'affiche avec les marqueurs colorés et le cercle de recherche
3. La liste affiche 10 résultats par page, filtrables et triables côté client (aucun nouvel appel réseau)
4. L'utilisateur peut filtrer par statut, trier, et cliquer sur un résultat pour voir la fiche détail

### Étape 8 — CRM (`useProspects.ts` + `localStorage`)

Quand l'utilisateur clique "+ Ajouter" sur un prospect :

1. `useProspects().add(establishment)` est appelé
2. L'établissement est sauvegardé dans `localStorage` (`pw_prospects`) avec le statut initial `to_contact` et la date d'ajout
3. Les changements de statut (`contacted`, `discussing`, `won`, `lost`) et les notes sont persistés en temps réel
4. L'export CSV lit toutes les entrées et génère un fichier téléchargeable

---

## Algorithmes détaillés

### Algorithme multi-zones (contournement de la limite Google Places)

```
Problème : Google Places Nearby Search → max 20 résultats par requête

Solution :
  Centre : (lat, lng)
  Rayon : r
  Offset : r × 0.5

  5 sous-centres :
  ┌─────────────────────────────────────────────┐
  │          Nord (lat + offset/111km)           │
  │                    │                         │
  │  Ouest ────── Centre ────── Est              │
  │                    │                         │
  │          Sud (lat - offset/111km)            │
  └─────────────────────────────────────────────┘

  Pour l'Est/Ouest, le décalage en longitude est corrigé
  par cos(lat) pour tenir compte de la courbure terrestre :
  delta_lng = offset / (111 320 × cos(lat × π/180))

  Chaque sous-centre → 1 appel Google Places → max 20 résultats
  5 appels en parallèle → fusion → déduplication par place.id
  → max 100 résultats par type de commerce
```

### Algorithme de détection de récence des sites web

```
Entrée : URL d'un site web

1. fetch(url, { timeout: 6s, headers: { User-Agent: "Mozilla/5.0..." } })
   → Si erreur ou status ≥ 500 : reachable = false → outdated

2. Lire les 50 premiers Ko (streaming par chunks)

3. detectRecentContent(html) :
   Stratégie 1 : en-tête HTTP Last-Modified
     → "Sat, 15 Mar 2025 10:00:00 GMT" → parser → isDateRecent()

   Stratégie 2 : balises meta
     → <meta name="last-modified" content="2024-11-01">
     → <meta property="article:modified_time" content="2025-01-15T...">

   Stratégie 3 : JSON-LD
     → <script type="application/ld+json">{"dateModified":"2024-..."}</script>

   Stratégie 4 : balise <time>
     → <time datetime="2024-03-12">

   Stratégie 5 : texte brut (fallback)
     → présence de "2025" ou "2024" (année en cours / année précédente)

   isDateRecent(date) : date > maintenant - 730 jours

4. Résultat :
   reachable = true, hasRecentContent = true  → "ok"
   reachable = true, hasRecentContent = false → "outdated"
   reachable = false                          → "outdated"
   website = null                             → "none"
```

### Cache en mémoire

```
Clé : "lat=45.748&lng=4.846&radius=3000&types=bakery"
       (lat/lng arrondis à 3 décimales, types triés)

Structure :
  Map<string, { value: T, expiresAt: number }>

TTL : 10 minutes
Nettoyage automatique si la Map dépasse 500 entrées
```

### Calcul de distance (Haversine)

Utilisé côté frontend pour trier les résultats par distance et afficher "À 1.2 km" :

```typescript
function distanceTo(from: {lat, lng}, to: {lat, lng}): number {
  const R = 6371000 // rayon Terre en mètres
  const dLat = (to.lat - from.lat) × π/180
  const dLng = (to.lng - from.lng) × π/180
  const a = sin²(dLat/2) + cos(from.lat) × cos(to.lat) × sin²(dLng/2)
  return R × 2 × atan2(√a, √(1-a))
}
```

---

## API du backend

### `GET /health`

Vérification que le serveur est en vie.

```
Réponse 200 :
{ "status": "ok" }
```

### `GET /api/search`

Recherche les commerces autour d'un point géographique et vérifie leurs sites web.

**En-têtes requis**

| En-tête | Description |
|---------|-------------|
| `x-internal-secret` | Secret partagé entre frontend et backend (voir `BACKEND_SECRET`) |

**Paramètres de requête**

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `address` | string | Oui (ou lat+lng) | Adresse textuelle à géocoder |
| `lat` | number | Oui (ou address) | Latitude GPS |
| `lng` | number | Oui (ou address) | Longitude GPS |
| `radius` | number | Oui | Rayon en mètres (1–10 000) |
| `types` | string | Non | Types séparés par virgule : `restaurant,bakery` |

**Exemple de requête**

```
GET /api/search?lat=48.8566&lng=2.3522&radius=2000&types=restaurant,cafe
x-internal-secret: [BACKEND_SECRET]
```

**Réponse 200**

```json
{
  "center": { "lat": 48.8566, "lng": 2.3522 },
  "radius": 2000,
  "summary": {
    "total": 87,
    "none": 34,
    "outdated": 18,
    "ok": 35
  },
  "establishments": [
    {
      "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Brasserie Le Marais",
      "address": "12 rue de Bretagne, 75003 Paris",
      "lat": 48.8601,
      "lng": 2.3609,
      "type": "restaurant",
      "phone": "+33 1 42 72 00 00",
      "website": "https://brasserie-lemarais.fr",
      "mapsUrl": "https://maps.google.com/?cid=...",
      "rating": 4.3,
      "ratingCount": 412,
      "websiteStatus": "outdated"
    }
  ]
}
```

**Codes d'erreur**

| Code | Cause |
|------|-------|
| 400 | Paramètres manquants ou radius hors limites |
| 401 | `x-internal-secret` absent ou incorrect |
| 429 | Rate limit dépassé (20 req/min) |
| 502 | Erreur API Google Places |
| 503 | `BACKEND_SECRET` non configuré sur le serveur |

---

## Modèles de données

### `Establishment` (interface TypeScript partagée)

```typescript
interface Establishment {
  id: string               // Google Place ID (stable)
  name: string
  address: string          // Adresse formatée
  lat: number
  lng: number
  type: string             // Type Google Places (ex: "bakery")
  phone: string | null
  website: string | null   // URL complète ou null
  mapsUrl: string          // Lien Google Maps
  rating: number | null    // Note 0–5
  ratingCount: number | null
  websiteStatus: 'none' | 'outdated' | 'ok'
}
```

### `SavedProspect` (localStorage)

```typescript
interface SavedProspect extends Establishment {
  crmStatus: 'to_contact' | 'contacted' | 'discussing' | 'won' | 'lost'
  notes: string
  addedAt: string          // Date ISO 8601
}
```

### Stockage client

| Clé | Stockage | Contenu |
|-----|----------|---------|
| `pw_prospects` | `localStorage` | `SavedProspect[]` — CRM complet |
| `pw_search_results` | `sessionStorage` | `SearchResult` — résultats de la session en cours |
| `pw_theme` | Cookie | Nom du thème actif |

---

## Variables d'environnement

### Fichier `.env` (racine du projet — chargé par le backend)

```env
GOOGLE_PLACES_KEY=AIzaSy...          # Clé Google API (Places + Geocoding)
BACKEND_SECRET=abc123...             # Secret partagé front/back (chaîne aléatoire longue)
```

### Fichier `frontend/.env.local` (chargé par Next.js)

```env
BACKEND_URL=http://localhost:4000    # URL du backend (Railway en prod)
BACKEND_SECRET=abc123...             # Même valeur que dans .env racine
```

### Fichier `backend/.env`

```env
PORT=4000                            # Port du serveur Express
FRONTEND_URL=http://localhost:3000   # URL du frontend (pour CORS)
```

### Variables à configurer sur les plateformes de déploiement

| Variable | Vercel (frontend) | Railway (backend) |
|----------|:-----------------:|:-----------------:|
| `GOOGLE_PLACES_KEY` | — | Oui |
| `BACKEND_SECRET` | Oui | — |
| `BACKEND_URL` | Oui (URL Railway) | — |
| `FRONTEND_URL` | — | Oui (URL Vercel) |
| `PORT` | — | Oui (ou auto-assigné) |

---

## Installation locale

### Prérequis

- Node.js 20+
- Une **clé Google Cloud API** avec les APIs suivantes activées :
  - **Places API (New)** — recherche de commerces
  - **Geocoding API** — conversion adresse → coordonnées

### 1. Cloner et configurer les variables

```bash
git clone https://github.com/sofianehms/prospectweb.git
cd prospectweb
cp .env.example .env
```

Éditer `.env` :
```env
GOOGLE_PLACES_KEY=votre_cle_google
BACKEND_SECRET=une_longue_chaine_aleatoire_secrete
```

Créer `frontend/.env.local` :
```env
BACKEND_URL=http://localhost:4000
BACKEND_SECRET=une_longue_chaine_aleatoire_secrete
```

Créer `backend/.env` :
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 2. Lancer le backend

```bash
cd backend
npm install
npm run dev     # Serveur Express sur http://localhost:4000
                # Redémarrage automatique à chaque modification (nodemon + ts-node)
```

### 3. Lancer le frontend

```bash
cd frontend
npm install
npm run dev     # Next.js sur http://localhost:3000
```

### Vérifier que tout fonctionne

```bash
# Tester le backend directement
curl http://localhost:4000/health
# → {"status":"ok"}

# Lancer une recherche (remplacer [SECRET] par la valeur de BACKEND_SECRET)
curl "http://localhost:4000/api/search?lat=48.85&lng=2.35&radius=1000&types=bakery" \
  -H "x-internal-secret: [SECRET]"
```

---

## Déploiement

### Fonctionnement général

Le projet utilise **deux plateformes distinctes** :
- **Vercel** héberge le frontend Next.js (serverless, CDN mondial)
- **Railway** héberge le backend Express (serveur persistent nécessaire pour le cache mémoire et les appels HTTP sortants)

Chaque `git push` sur `main` déclenche automatiquement les deux déploiements.

### Déploiement du backend sur Railway

1. Créer un compte sur [railway.app](https://railway.app)
2. Nouveau projet → "Deploy from GitHub repo" → sélectionner ce dépôt
3. Railway détecte le dossier `backend/` grâce au `package.json`
4. Configurer les variables d'environnement dans Railway :
   - `GOOGLE_PLACES_KEY` = votre clé Google
   - `FRONTEND_URL` = `https://votre-projet.vercel.app` (à renseigner après déploiement Vercel)
   - `PORT` = Railway l'assigne automatiquement via `$PORT`
5. Railway exécute automatiquement `npm run build` puis `npm start`
6. Récupérer l'URL générée par Railway (ex: `https://prospectweb-backend.railway.app`)

### Déploiement du frontend sur Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. Nouveau projet → importer ce dépôt GitHub
3. Configurer le **Root Directory** sur `frontend` dans les paramètres du projet
4. Configurer les variables d'environnement dans Vercel :
   - `BACKEND_URL` = URL Railway du backend (ex: `https://prospectweb-backend.railway.app`)
   - `BACKEND_SECRET` = même valeur que dans `.env` racine
5. Vercel exécute `next build` et déploie

### Ordre de déploiement recommandé

```
1. Déployer le backend sur Railway → récupérer l'URL
2. Configurer FRONTEND_URL sur Railway avec l'URL Vercel future
3. Déployer le frontend sur Vercel → récupérer l'URL
4. Mettre à jour FRONTEND_URL sur Railway si l'URL Vercel diffère
5. Vérifier la communication : ouvrir l'app → lancer une recherche
```

### Variables d'environnement en production

Railway et Vercel permettent de configurer les variables via leur interface web ou leur CLI. Ces variables ne doivent jamais être commitées en clair (le `.gitignore` exclut déjà `.env`, `.env.local`, `*.env`).

---

## Stack technique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| Frontend framework | Next.js | 16.2.6 | App Router, Server Components, SSR |
| UI | React | 19 | Composants client interactifs |
| Styles | Tailwind CSS | v4 | Utilitaire CSS, thèmes via variables CSS |
| Carte | Leaflet.js | 1.9 | Carte interactive, marqueurs |
| Backend | Express | 5.2.1 | API REST, middleware |
| Langage | TypeScript | 5–6 | Typage strict front et back |
| API commerces | Google Places API (New) | v1 | Nearby Search, données établissements |
| API géocodage | Google Geocoding API | v1 | Adresse → coordonnées |
| Autocomplétion | Nominatim (OSM) | — | Suggestions d'adresses, sans quota |
| Tuiles carte | OpenStreetMap | — | Fond de carte |
| Déploiement frontend | Vercel | — | Build Next.js, CDN, serverless |
| Déploiement backend | Railway | — | Serveur Node.js persistent |

---

## APIs externes

### Google Places API (New)

- **Endpoint :** `POST https://places.googleapis.com/v1/places:searchNearby`
- **Authentification :** header `x-goog-api-key`
- **Limite :** 20 résultats par requête (contourné par la stratégie multi-zones)
- **Champs récupérés :** id, displayName, formattedAddress, location, websiteUri, nationalPhoneNumber, types, rating, userRatingCount, googleMapsUri

### Google Geocoding API

- **Endpoint :** `GET https://maps.googleapis.com/maps/api/geocode/json`
- **Authentification :** paramètre `key` dans l'URL
- **Usage :** uniquement quand l'utilisateur saisit une adresse textuelle (pas de coordonnées GPS)

### Nominatim (OpenStreetMap)

- **Endpoint :** `GET https://nominatim.openstreetmap.org/search`
- **Authentification :** aucune
- **Usage :** autocomplétion côté frontend uniquement
- **Limite :** 1 requête par seconde (respecté car déclenché par frappe utilisateur avec debounce)

---

## Crédits

- Données commerces : [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- Carte : [Leaflet.js](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org)
- Autocomplétion adresses : [Nominatim](https://nominatim.org) (OpenStreetMap)
