import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Nosite',
}

export default function CguPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AppHeader>
        <Link href="/" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          Accueil
        </Link>
      </AppHeader>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-gray-500 dark:text-slate-400">Dernière mise à jour : 30 juin 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">1. Objet</h2>
            <p>Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès et l&apos;utilisation du service Nosite, accessible à l&apos;adresse <strong>nosite.fr</strong>, édité par Sofiane H. (auto-entrepreneur).</p>
            <p className="mt-2">En créant un compte ou en utilisant le service, vous acceptez sans réserve les présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">2. Description du service</h2>
            <p>Nosite est un outil de prospection commerciale B2B permettant de :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Rechercher des établissements via Google Maps selon des critères géographiques et sectoriels.</li>
              <li>Détecter les établissements sans site web ou avec un site web de mauvaise qualité.</li>
              <li>Gérer un pipeline CRM de prospects (statuts, notes, export CSV).</li>
              <li>Enrichir les fiches avec des données publiques (SIRET, dirigeant, code NAF) via l&apos;API Recherche Entreprises.</li>
            </ul>
            <p className="mt-2">Le service est destiné à un usage professionnel, notamment aux agences web, freelances et commerciaux.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">3. Création de compte</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>L&apos;accès au service nécessite la création d&apos;un compte via l&apos;adresse e-mail ou une authentification tierce (Google, etc.), gérée par Clerk.</li>
              <li>Vous devez fournir des informations exactes et les maintenir à jour.</li>
              <li>Vous êtes seul responsable de la confidentialité de votre compte et de toutes les actions réalisées depuis celui-ci.</li>
              <li>Vous devez avoir au moins 18 ans ou agir pour le compte d&apos;une entreprise dûment habilitée.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">4. Utilisation acceptable</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Utiliser le service à des fins illicites, frauduleuses ou contraires aux présentes CGU.</li>
              <li>Tenter de contourner les limites d&apos;utilisation (quotas, restrictions de plan).</li>
              <li>Automatiser les requêtes au-delà des quotas alloués à votre abonnement sans autorisation écrite.</li>
              <li>Revendre, louer ou sous-licencier l&apos;accès au service à des tiers.</li>
              <li>Extraire massivement les données du service à des fins de constitution d&apos;une base concurrente.</li>
              <li>Utiliser les données de prospection obtenues d&apos;une manière non conforme au RGPD (notamment en matière de prospection commerciale directe).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">5. Abonnements et accès</h2>
            <p>Le service est disponible selon trois niveaux d&apos;accès :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Gratuit</strong> : accès limité à 1 recherche et 100 prospects en base.</li>
              <li><strong>Pro</strong> : 29 €/mois — 300 recherches/jour, 1 000 prospects, CRM Kanban, export CSV &amp; Sheets, score IA.</li>
              <li><strong>Business</strong> : 79 €/mois — 1 000 recherches/jour, 10 000 prospects, multi-utilisateurs, accès API.</li>
            </ul>
            <p className="mt-2">Les conditions tarifaires détaillées sont disponibles sur la <Link href="/#tarifs" className="text-emerald-600 underline">page Tarifs</Link>. La facturation est mensuelle. Les modalités de paiement et d&apos;annulation sont précisées dans les <Link href="/cgv" className="text-emerald-600 underline">CGV</Link>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">6. Propriété intellectuelle</h2>
            <p>L&apos;ensemble des éléments constituant le service (interface, algorithmes, base de données, marque « Nosite ») est la propriété exclusive de Sofiane H.. Toute reproduction, représentation ou exploitation non autorisée est interdite.</p>
            <p className="mt-2">Les données générées par l&apos;utilisateur (notes CRM, statuts) restent sa propriété. L&apos;utilisateur accorde à Nosite une licence limitée d&apos;hébergement et de traitement de ces données aux fins de fourniture du service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">7. Disponibilité du service</h2>
            <p>Nosite s&apos;efforce d&apos;assurer la disponibilité du service 24h/24, 7j/7, mais ne peut garantir une disponibilité ininterrompue. Des interruptions pour maintenance ou en cas de force majeure peuvent survenir. Nosite ne saurait être tenu responsable des conséquences d&apos;une indisponibilité temporaire.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">8. Limitation de responsabilité</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nosite est un outil d&apos;aide à la prospection. La pertinence des résultats dépend des données tiers (Google Maps, API Recherche Entreprises) et n&apos;est pas garantie.</li>
              <li>Nosite ne saurait être tenu responsable des décisions commerciales prises sur la base des données fournies.</li>
              <li>En cas de manquement avéré imputable à Nosite, la responsabilité est limitée au montant des sommes effectivement versées par l&apos;utilisateur au cours des trois derniers mois.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">9. Résiliation</h2>
            <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres. La résiliation entraîne la suppression de vos données conformément à la <Link href="/privacy" className="text-emerald-600 underline">politique de confidentialité</Link>.</p>
            <p className="mt-2">Nosite se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni remboursement.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">10. Modification des CGU</h2>
            <p>Nosite peut modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur cette page. En cas de modification substantielle, les utilisateurs actifs seront informés par e-mail. La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles conditions.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">11. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux compétents sont ceux du ressort du siège de l&apos;éditeur.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">12. Contact</h2>
            <p>Pour toute question relative aux présentes CGU : <a href="mailto:contact@nosite.fr" className="text-emerald-600 underline">contact@nosite.fr</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
