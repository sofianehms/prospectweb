# API publique Nosite — v1

Base URL : `https://votre-backend.railway.app/api/v1`

## Authentification

Toutes les requetes necessitent un header `x-api-key` :

```
x-api-key: votre_cle_api
```

Les cles API sont generees depuis la page Parametres de l'application. Chaque cle est liee a un utilisateur et a des scopes.

### Scopes

| Scope | Description |
|---|---|
| `prospects:read` | Lire la liste des prospects |
| `prospects:write` | Ajouter des prospects, modifier le statut CRM |
| `search` | Lancer des recherches (consomme le quota) |

---

## Endpoints

### GET /prospects

Liste tous les prospects de l'utilisateur.

**Scope requis :** `prospects:read`

**Parametres query :**
| Parametre | Type | Description |
|---|---|---|
| `format` | string | `json` (defaut) ou `csv` |

**Reponse JSON :**
```json
{
  "total": 42,
  "prospects": [
    {
      "id": "ChIJ...",
      "name": "Pizzeria Da Luigi",
      "address": "12 Rue de la Paix, Paris",
      "type": "restaurant",
      "phone": "+33 1 23 45 67 89",
      "mapsUrl": "https://www.google.com/maps/...",
      "websiteStatus": "none",
      "crmStatus": "to_contact",
      "notes": "Proprietaire sympa",
      "addedAt": "2026-06-15T14:30:00.000Z"
    }
  ]
}
```

**Reponse CSV (`?format=csv`) :**
Fichier CSV telecharge directement avec les memes champs.

---

### POST /prospects

Ajoute un prospect.

**Scope requis :** `prospects:write`

**Body JSON :**
```json
{
  "id": "ChIJ...",
  "name": "Boulangerie Martin",
  "address": "5 Rue du Commerce, Lyon",
  "type": "bakery",
  "mapsUrl": "https://www.google.com/maps/...",
  "phone": "+33 4 56 78 90 12",
  "websiteStatus": "none"
}
```

**Champs requis :** `id`, `name`, `address`, `type`, `mapsUrl`

**Reponse :** `201 Created` avec le prospect cree.

---

### PATCH /prospects/:id/status

Modifie le statut CRM d'un prospect.

**Scope requis :** `prospects:write`

**Body JSON :**
```json
{
  "status": "contacted"
}
```

**Valeurs acceptees :** `to_contact`, `contacted`, `discussing`, `won`, `lost`

---

### GET /search

Lance une recherche de commerces dans une zone.

**Scope requis :** `search`

**Parametres query :**
| Parametre | Type | Requis | Description |
|---|---|---|---|
| `address` | string | oui* | Adresse a geocoder |
| `lat` | number | oui* | Latitude (alternative a `address`) |
| `lng` | number | oui* | Longitude (alternative a `address`) |
| `radius` | number | oui | Rayon en metres (1-10000) |
| `types` | string | non | Types de commerces separes par virgule (ex: `restaurant,cafe`) |

*`address` OU `lat`+`lng` requis.

**Reponse JSON :**
```json
{
  "center": { "lat": 48.85, "lng": 2.35 },
  "radius": 3000,
  "total": 34,
  "establishments": [
    {
      "id": "ChIJ...",
      "name": "Pizzeria Da Luigi",
      "address": "12 Rue de la Paix, Paris",
      "lat": 48.856,
      "lng": 2.352,
      "type": "restaurant",
      "phone": null,
      "website": null,
      "mapsUrl": "https://www.google.com/maps/...",
      "rating": 4.8,
      "ratingCount": 892,
      "websiteStatus": "none",
      "confidenceScore": 0
    }
  ],
  "meta": {
    "partial": false,
    "cappedTypes": [],
    "failedTypes": []
  }
}
```

---

## Codes d'erreur

| Code | Signification |
|---|---|
| 400 | Parametres invalides |
| 401 | Cle API manquante ou invalide |
| 403 | Scope manquant |
| 404 | Ressource non trouvee |
| 429 | Quota depasse |
| 500 | Erreur interne |

## Rate-limiting

Les requetes sont soumises au meme quota que l'interface web :
- Quota par utilisateur par jour (`USER_DAILY_LIMIT`)
- Rate-limit par minute (partage entre API et interface web)

## Types de commerces supportes

`restaurant`, `cafe`, `bar`, `hotel`, `bakery`, `clothing_store`, `pharmacy`, `hair_salon`, `beauty_salon`, `real_estate_agency`, `gym`, `car_repair`, `florist`, `dentist`, `doctor`, `supermarket`, `pet_store`, `travel_agency`

---

Derniere mise a jour : 2026-06-27
