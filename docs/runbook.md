# Runbook incidents — Nosite

Procedures de diagnostic et de resolution pour les incidents courants.
Chaque section reference l'alerte correspondante (type `alertService.ts`).

---

## 1. Circuit-breaker Google Places ouvert

**Alerte :** `circuit_breaker_open` (cooldown 5 min)
**Symptomes :** les recherches renvoient 502 "Google Places temporairement desactive", les logs affichent `[circuit-breaker] Google Places circuit OPEN`.

### Diagnostic

1. Verifier les logs backend :
   ```
   railway logs --filter "[circuit-breaker]"
   ```
2. Verifier le statut Google : [Google Cloud Status](https://status.cloud.google.com/)
3. Verifier le dashboard ops (`/ops`) : l'etat du circuit-breaker, le nombre d'echecs consecutifs, l'heure de retablissement prevue.

### Actions

- **Si panne Google confirmee** : attendre. Le circuit-breaker se referme automatiquement apres 60 secondes. Les utilisateurs voient le message d'erreur, pas une page blanche.
- **Si pas de panne Google** : verifier que la cle API est valide (non revoquee, non expiree, quotas non atteints).
  ```
  # Tester la cle manuellement
  curl -s -H "X-Goog-Api-Key: $GOOGLE_PLACES_KEY" \
       -H "X-Goog-FieldMask: places.id" \
       -d '{"locationRestriction":{"circle":{"center":{"latitude":48.85,"longitude":2.35},"radius":100}}}' \
       https://places.googleapis.com/v1/places:searchNearby
  ```
- **Si cle revoquee** : generer une nouvelle cle dans Google Cloud Console, mettre a jour `GOOGLE_PLACES_KEY` dans Railway, redemarrer le backend.

### Repli automatique (Overpass/OSM)

Quand le circuit-breaker est ouvert, la route `/api/search` bascule automatiquement sur le fournisseur Overpass (OpenStreetMap). Les resultats sont degrades :
- Pas de note Google ni d'avis (rating/ratingCount = null)
- Pas de Place ID Google (identifiants prefixes `osm:`)
- Couverture variable selon les contributions OSM locales
- Le champ `provider` dans la reponse vaut `'overpass'` au lieu de `'google'`

L'alerte `circuit_breaker_open` est envoyee par e-mail. Aucune intervention manuelle n'est requise pour la bascule.

### Retablissement

Le circuit-breaker se referme automatiquement apres 60 secondes. Les recherches repassent sur Google Places. Verifier dans `/ops` que l'etat repasse a "ferme".

### Escalade

Si le circuit-breaker reste ouvert plus de 10 minutes sans panne Google visible : contacter le support Google Cloud.

---

## 2. Quota Google atteint (80%)

**Alerte :** `google_quota_80` (cooldown 1h)
**Symptomes :** les logs affichent `[ALERT] google_quota_80`, les recherches fonctionnent encore mais le seuil approche.

### Diagnostic

1. Verifier le compteur dans `/ops` : consommation Google du jour vs limite.
2. Verifier dans Google Cloud Console > APIs & Services > Dashboard > Places API (New) : courbe de requetes du jour.

### Actions

- **Comportement normal (pic d'usage)** : rien a faire. L'alerte est preventive.
- **Usage anormal (bot, boucle)** : identifier l'utilisateur dans les logs et le bloquer si necessaire.
  ```
  railway logs --filter "[search]" | grep "user="
  ```
- **Augmenter la limite temporairement** : modifier `GOOGLE_DAILY_LIMIT` dans Railway si le pic est legitime.

### Prevention

- Les quotas par utilisateur (`USER_DAILY_LIMIT`) limitent deja l'abus individuel.
- Les quotas Google Cloud (QPD) sont le dernier rempart.

---

## 3. Quota Google atteint (100%)

**Alerte :** `google_quota_100` (cooldown 1h)
**Symptomes :** les recherches renvoient 429 "Quota depasse", aucun appel Google n'est possible jusqu'au lendemain (reset quotidien).

### Diagnostic

1. Confirmer dans `/ops` que le compteur a atteint la limite.
2. Verifier l'heure : le compteur Redis se reinitialise a minuit UTC.

### Actions

- **Attendre le reset** : le compteur repart a zero a minuit UTC.
- **Augmenter la limite** : modifier `GOOGLE_DAILY_LIMIT` dans Railway (attention au cout).
- **Communiquer** : si des utilisateurs signalent le probleme, informer que le service reprendra le lendemain.

### Escalade

Si le quota est atteint quotidiennement : revoir la tarification ou augmenter le budget Google Cloud.

---

## 4. Paiement Stripe echoue

**Alerte :** `payment_failed` (cooldown 30 min)
**Symptomes :** le webhook `invoice.payment_failed` est recu, l'alerte est envoyee par e-mail.

### Diagnostic

1. Verifier dans le dashboard Stripe > Payments : quel paiement a echoue, pour quel client.
2. Verifier le statut de l'abonnement : Stripe > Subscriptions > chercher le client.

### Actions

- **Carte expiree/refusee** : Stripe retente automatiquement (jusqu'a 4 tentatives sur 3 semaines). L'utilisateur recoit un e-mail de Stripe lui demandant de mettre a jour sa carte.
- **Fraude detectee** : verifier dans Stripe > Radar. Bloquer le client si necessaire.
- **Abonnement annule automatiquement** : apres les tentatives echouees, Stripe annule l'abonnement. Le webhook `customer.subscription.deleted` remet l'utilisateur en plan Free.

### Prevention

- Stripe Smart Retries est active par defaut.
- La page `/settings` permet a l'utilisateur de gerer son moyen de paiement via le portail Stripe.

---

## 5. Redis indisponible

**Alerte :** aucune alerte automatique (Redis est lui-meme le transport des alertes).
**Symptomes :** logs `[cache] Redis connection failed, falling back to in-memory`, degradation des performances (pas de cache), rate-limiting passe en memoire (non partage entre instances).

### Diagnostic

1. Verifier le statut Redis dans Railway > service Redis > Logs.
2. Tester la connexion :
   ```
   redis-cli -u $REDIS_URL ping
   ```

### Actions

- **Redis crashe** : redemarrer le service Redis dans Railway.
- **Redis plein (memoire)** : verifier `INFO memory` dans redis-cli. Augmenter le plan Railway ou reduire le TTL du cache.
- **Redis inaccessible (reseau)** : verifier les variables d'environnement (`REDIS_URL`), verifier le networking Railway.

### Impact en mode degrade

Le backend continue de fonctionner sans Redis :
- Cache : fallback en memoire (reset a chaque deploiement, non partage)
- Rate-limiting : fallback en memoire (non partage entre instances)
- Circuit-breaker : fallback en memoire (non partage)
- Alertes : le cooldown de deduplication ne fonctionne plus (risque de spam d'alertes)

### Retablissement

Une fois Redis de retour, tout reprend automatiquement. Pas d'action manuelle necessaire.

---

## 6. Base de donnees PostgreSQL indisponible

**Alerte :** aucune alerte automatique.
**Symptomes :** erreurs 500 sur les operations CRM (prospects, historique, plans), logs `PrismaClientKnownRequestError` ou `ECONNREFUSED`.

### Diagnostic

1. Verifier le statut PostgreSQL dans Railway > service Postgres > Logs.
2. Tester la connexion :
   ```
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Actions

- **DB crashee** : redemarrer le service dans Railway.
- **DB pleine (stockage)** : verifier `SELECT pg_database_size(current_database())`. Augmenter le plan ou purger les donnees anciennes.
- **Connexions saturees** : verifier `SELECT count(*) FROM pg_stat_activity`. Redemarrer le backend si necessaire.
- **Migration manquante** : verifier avec `npx prisma migrate status` et appliquer avec `npx prisma migrate deploy`.

### Impact en mode degrade

- La recherche Google fonctionne (ne depend pas de la DB).
- Le CRM, l'historique, les plans et les quotas par utilisateur sont indisponibles.
- L'authentification (Clerk) fonctionne (ne depend pas de la DB).

---

## Recapitulatif des alertes

| Type d'alerte | Declencheur | Cooldown | Gravite |
|---|---|---|---|
| `circuit_breaker_open` | 3 echecs Google consecutifs | 5 min | Critique |
| `google_quota_80` | 80% du quota quotidien atteint | 1h | Avertissement |
| `google_quota_100` | 100% du quota quotidien atteint | 1h | Critique |
| `google_api_error` | Erreur API Google ponctuelle | 10 min | Info |
| `payment_failed` | Webhook Stripe `invoice.payment_failed` | 30 min | Avertissement |

Les alertes sont envoyees par e-mail via Resend a l'adresse configuree dans `ALERT_EMAIL`. Le cooldown empeche le spam en cas d'incident prolonge.

---

Derniere mise a jour : 2026-06-27
