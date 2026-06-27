# Checklist de deploiement — Nosite

A cocher avant chaque ouverture (beta puis public).
Couvre les barrieres plateforme hors depot (angles morts assumes) autant que les correctifs applicatifs.

---

## 1. Secrets (Vercel + Railway)

- [ ] **Clerk** : `CLERK_SECRET_KEY` (backend), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` (frontend)
- [ ] **Stripe** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`
- [ ] **Resend** : `RESEND_API_KEY`, `RESEND_FROM`
- [ ] **Google** : `GOOGLE_PLACES_KEY`
- [ ] **Redis** : `REDIS_URL`
- [ ] **Postgres** : `DATABASE_URL`
- [ ] **Sentry** : `SENTRY_DSN` (backend), `NEXT_PUBLIC_SENTRY_DSN` (frontend)
- [ ] **Mixpanel** : `NEXT_PUBLIC_MIXPANEL_TOKEN`
- [ ] **Interne** : `BACKEND_SECRET` (meme valeur front + back), `JWT_SECRET`

Verification : aucune variable vide dans les env de production. Comparer avec `backend/.env.example` et `frontend/.env.example`.

---

## 2. Quotas Google Cloud (QPD)

- [ ] Quotas QPD par SKU configures dans la console Google Cloud (APIs & Services > Quotas)
  - Places API (New) : Nearby Search, Place Details
  - Verifier que les limites correspondent au plan tarifaire choisi
- [ ] Alertes budgetaires actives (Billing > Budgets & Alerts)
  - Seuils recommandes : 50%, 80%, 100% du budget mensuel
  - Notification par e-mail vers `ALERT_EMAIL`

---

## 3. Cle API Google restreinte

- [ ] Restrictions d'application : referents HTTP (frontend) ou IP serveur (backend)
- [ ] Restrictions d'API : seules les APIs utilisees sont autorisees (Places API New)
- [ ] Cle de test separee pour l'environnement de dev/staging

---

## 4. Webhooks Stripe

- [ ] Endpoint webhook configure dans Stripe > Developers > Webhooks
  - URL : `https://votre-backend.railway.app/api/stripe/webhook`
  - Evenements ecoutes : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Signing secret (`STRIPE_WEBHOOK_SECRET`) copie dans les variables d'environnement
- [ ] Signature verifiee dans le code (middleware `express.raw`)
- [ ] Idempotence : un evenement rejoue ne duplique pas les effets

Test : declencher un webhook de test depuis le dashboard Stripe et verifier les logs backend.

---

## 5. Clerk

- [ ] Domaines autorises configures (Clerk > Settings > Domains)
  - Production : `votre-domaine.fr`, `www.votre-domaine.fr`
  - Retirer `localhost` en production
- [ ] Redirections post-login/signup configurees
- [ ] Politique de mot de passe : longueur minimale 8 caracteres, check breach
- [ ] Anti-bot active (Turnstile ou reCAPTCHA) sur sign-in/sign-up
- [ ] OAuth Google configure si utilise (Google > API Console > OAuth consent screen)

---

## 6. CSP (Content Security Policy)

- [ ] Production sans `unsafe-inline` / `unsafe-eval` si possible
- [ ] Domaines Clerk autorises : `*.clerk.accounts.dev`, `clerk.votre-domaine.fr`
- [ ] Domaines Stripe autorises : `js.stripe.com`, `api.stripe.com`
- [ ] Domaines Sentry autorises : `*.ingest.sentry.io`
- [ ] Verifier dans les DevTools > Console qu'aucune violation CSP n'apparait

---

## 7. Routes protegees

- [ ] `/api/usage` global protege ou retire
- [ ] `PATCH /plans/me` verrouille derriere abonnement actif
- [ ] `/api/ops` restreint au role admin (`requireAdmin`)
- [ ] Toutes les routes API passent par `requireAuth` + `requireInternalSecret`

---

## 8. Quotas et rate-limiting

- [ ] `GOOGLE_DAILY_LIMIT` et `USER_DAILY_LIMIT` configures en production
- [ ] Rate-limiter autoritatif stocke en Redis (partage multi-instance)
- [ ] Compteurs par utilisateur en base de donnees (pas seulement en memoire)
- [ ] Verifier : un utilisateur au quota ne peut plus lancer de recherche (reponse 429)

---

## 9. Circuit-breaker et alertes

- [ ] Circuit-breaker en etat partage (Redis) entre instances
- [ ] Alerte active sur :
  - Circuit-breaker ouvert (panne Google Places)
  - Seuil quota Google (80%, 100%)
  - Paiement echoue (webhook `invoice.payment_failed`)
- [ ] `ALERT_EMAIL` configure et teste (envoyer une alerte de test)

---

## 10. Resend (e-mails transactionnels)

- [ ] Domaine d'envoi verifie dans Resend (DNS : SPF, DKIM, DMARC)
- [ ] `RESEND_FROM` utilise le domaine verifie
- [ ] E-mails transactionnels testes :
  - Alerte circuit-breaker
  - Alerte quota
  - Alerte paiement echoue

---

## 11. Monitoring

- [ ] **Sentry** actif backend (Express) et frontend (Next.js)
  - Verifier : provoquer une erreur et confirmer qu'elle apparait dans Sentry
  - Aucune donnee personnelle sensible envoyee (scrubbing PII)
- [ ] **Mixpanel** collecte les evenements cles (signup, search, export, upgrade)
- [ ] **Vercel Analytics** + **Speed Insights** actifs (composants dans `layout.tsx`)

---

## 12. Base de donnees

- [ ] Sauvegardes Postgres automatiques (quotidiennes, retention 7j minimum)
- [ ] Politique de purge :
  - Donnees Google Places en cache : TTL 30 jours (Redis)
  - Comptes inactifs > 12 mois : a definir (RGPD)
- [ ] Migrations appliquees (`npx prisma migrate deploy` ou equivalent)

---

## 13. Conformite et legal

- [ ] Politique de confidentialite publiee (`/privacy`)
- [ ] Opt-out tiers disponible (suppression de compte = suppression des donnees)
- [ ] Avis juridique sur l'export de donnees Google Places (ToS, RGPD)
- [ ] Bandeau cookies/consentement si Mixpanel actif

---

## 14. Tests en CI

- [ ] Suite de tests verte (184+ tests)
- [ ] Tests d'integration auth Clerk (session valide/invalide)
- [ ] Tests webhook Stripe (signature, idempotence)
- [ ] Test de charge simule : quota et rate-limit sous concurrence multi-instance

---

## Protections de cout avant ouverture

| Protection | Ou la configurer | Seuil recommande |
|---|---|---|
| Budget Google Cloud | Billing > Budgets | Alertes a 50/80/100% |
| QPD Google Places | APIs > Quotas | Selon plan tarifaire |
| `GOOGLE_DAILY_LIMIT` | `.env` backend | 500 (free), ajuster selon plan |
| `USER_DAILY_LIMIT` | `.env` backend | 50-300 selon plan |
| Plafond Stripe | Dashboard > Settings | Aucun plafond natif, surveiller via webhooks |

---

## Ordre de verification recommande

1. Secrets (section 1) — sans eux rien ne demarre
2. Base de donnees (section 12) — migrations
3. Clerk (section 5) — auth fonctionnelle
4. Stripe (section 4) — paiement fonctionnel
5. Google (sections 2-3) — recherche fonctionnelle
6. Alertes (section 9) — filet de securite
7. Monitoring (section 11) — visibilite
8. CSP + routes (sections 6-7) — securite
9. Legal (section 13) — conformite
10. CI (section 14) — regression

Derniere mise a jour : 2026-06-27
