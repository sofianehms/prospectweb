import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export const metadata = {
  title: 'Conditions Générales de Vente — Nosite',
}

export default function CgvPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AppHeader>
        <Link href="/" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          Accueil
        </Link>
      </AppHeader>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Conditions Générales de Vente</h1>
          <p className="text-gray-500 dark:text-slate-400">Dernière mise à jour : 30 juin 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">1. Objet et champ d&apos;application</h2>
            <p>Les présentes Conditions Générales de Vente (« CGV ») régissent les ventes d&apos;abonnements au service Nosite, édité par Sofiane H. (auto-entrepreneur, SIRET 942 973 546 00016), à tout utilisateur professionnel (B2B). Elles complètent les <Link href="/cgu" className="text-emerald-600 underline">Conditions Générales d&apos;Utilisation</Link>.</p>
            <p className="mt-2">L&apos;achat d&apos;un abonnement vaut acceptation sans réserve des présentes CGV.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">2. Offres et prix</h2>
            <p>Les abonnements disponibles sont les suivants :</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                <p className="font-semibold text-gray-900 dark:text-slate-100">Plan Gratuit — 0 €/mois</p>
                <ul className="list-disc pl-5 space-y-0.5 mt-1 text-gray-500 dark:text-slate-400">
                  <li>1 recherche gratuite</li>
                  <li>100 prospects en base</li>
                  <li>Export CSV, CRM basique, score site web</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                <p className="font-semibold text-gray-900 dark:text-slate-100">Plan Pro — 29 €/mois HT</p>
                <ul className="list-disc pl-5 space-y-0.5 mt-1 text-gray-500 dark:text-slate-400">
                  <li>300 recherches/jour</li>
                  <li>1 000 prospects en base</li>
                  <li>CRM Kanban complet, export CSV &amp; Sheets</li>
                  <li>Score IA avancé, vue carte interactive</li>
                  <li>Support prioritaire</li>
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                <p className="font-semibold text-gray-900 dark:text-slate-100">Plan Business — 79 €/mois HT</p>
                <ul className="list-disc pl-5 space-y-0.5 mt-1 text-gray-500 dark:text-slate-400">
                  <li>1 000 recherches/jour</li>
                  <li>10 000 prospects en base</li>
                  <li>Tout le plan Pro inclus</li>
                  <li>Multi-utilisateurs, accès API</li>
                  <li>Onboarding personnalisé</li>
                </ul>
              </div>
            </div>
            <p className="mt-3">Les prix sont indiqués hors taxes (HT). En tant qu&apos;auto-entrepreneur bénéficiant de la franchise en base de TVA (article 293 B du CGI), aucune TVA n&apos;est appliquée — mention « TVA non applicable ». Nosite se réserve le droit de modifier ses tarifs à tout moment, avec un préavis de 30 jours pour les abonnements en cours.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">3. Commande et facturation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>L&apos;abonnement est souscrit en ligne via la page Tarifs. La commande est confirmée dès validation du paiement.</li>
              <li>La facturation est <strong>mensuelle</strong>, à terme échu, par prélèvement automatique sur la carte bancaire renseignée lors de l&apos;abonnement.</li>
              <li>Le paiement est traité par <strong>Stripe</strong> (PCI DSS Niveau 1). Nosite ne stocke aucune donnée bancaire.</li>
              <li>Un justificatif de paiement est envoyé par e-mail à chaque renouvellement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">4. Droit de rétractation</h2>
            <p>Conformément à l&apos;article L.221-28 du Code de la consommation, <strong>le droit de rétractation de 14 jours ne s&apos;applique pas</strong> aux services numériques dont l&apos;exécution a commencé, avec l&apos;accord exprès de l&apos;utilisateur, avant l&apos;expiration du délai de rétractation.</p>
            <p className="mt-2">En souscrivant un abonnement Nosite et en accédant immédiatement au service, vous reconnaissez expressément renoncer à ce droit de rétractation.</p>
            <p className="mt-2">Cette clause s&apos;applique aux abonnements payants. Le plan Gratuit ne donnant lieu à aucun paiement, aucune rétractation n&apos;est pertinente.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">5. Annulation et remboursement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Annulation</strong> : vous pouvez annuler votre abonnement à tout moment depuis votre espace « Paramètres &gt; Abonnement ». L&apos;annulation prend effet à la fin de la période de facturation en cours — vous conservez l&apos;accès jusqu&apos;à cette date.</li>
              <li><strong>Remboursements</strong> : en règle générale, aucun remboursement partiel ou prorata n&apos;est accordé pour une période en cours. Toutefois, en cas d&apos;erreur de facturation avérée ou de défaillance technique imputable à Nosite rendant le service inutilisable, un remboursement au prorata peut être accordé sur demande motivée adressée à <a href="mailto:contact@nosite.fr" className="text-emerald-600 underline">contact@nosite.fr</a>.</li>
              <li><strong>Non-paiement</strong> : en cas d&apos;échec du prélèvement, l&apos;accès aux fonctionnalités payantes peut être suspendu après une période de grâce de 7 jours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">6. Évolution des offres</h2>
            <p>Nosite se réserve le droit de modifier les fonctionnalités incluses dans chaque plan. En cas de suppression d&apos;une fonctionnalité substantielle, les abonnés concernés seront informés par e-mail au moins 30 jours à l&apos;avance et pourront annuler sans frais.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">7. Données à caractère professionnel</h2>
            <p>Les abonnements Nosite sont destinés à un usage professionnel (B2B). En souscrivant, vous confirmez agir à titre professionnel. Les dispositions protectrices du droit de la consommation applicables aux particuliers ne s&apos;appliquent pas.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">8. Droit applicable et litiges</h2>
            <p>Les présentes CGV sont soumises au droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant toute action judiciaire. À défaut d&apos;accord, les tribunaux compétents sont ceux du ressort du siège de Nosite.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">9. Contact</h2>
            <p>Pour toute question relative à votre abonnement ou à la facturation : <a href="mailto:contact@nosite.fr" className="text-emerald-600 underline">contact@nosite.fr</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
