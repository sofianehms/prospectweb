import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AppHeader>
        <Link href="/" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          Accueil
        </Link>
      </AppHeader>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Politique de confidentialit&eacute;</h1>
          <p className="text-gray-500 dark:text-slate-400">Derni&egrave;re mise &agrave; jour : 27 juin 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">1. Responsable du traitement</h2>
            <p>Nosite est un outil de prospection commerciale B2B. Le responsable du traitement est l&apos;exploitant de l&apos;instance d&eacute;ploy&eacute;e. Contact : <a href="mailto:sofiane.hoummass@icloud.com" className="text-emerald-600 underline">sofiane.hoummass@icloud.com</a></p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">2. Donn&eacute;es collect&eacute;es</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Donn&eacute;es de compte</strong> : adresse e-mail, authentification g&eacute;r&eacute;e par Clerk (sessions s&eacute;curis&eacute;es, pas de mot de passe stock&eacute; c&ocirc;t&eacute; Nosite).</li>
              <li><strong>Donn&eacute;es de prospection</strong> : fiches d&apos;&eacute;tablissements issus de Google Places (nom, adresse, t&eacute;l&eacute;phone, note, statut du site web), statut CRM et notes personnelles.</li>
              <li><strong>Donn&eacute;es d&apos;enrichissement</strong> : SIRET, nom du dirigeant et activit&eacute; NAF issus de l&apos;API Recherche Entreprises (donn&eacute;es publiques open data).</li>
              <li><strong>Donn&eacute;es d&apos;usage</strong> : compteurs de requ&ecirc;tes journaliers, &eacute;v&eacute;nements analytics (Mixpanel, anonymis&eacute;s, IP d&eacute;sactiv&eacute;e).</li>
              <li><strong>Donn&eacute;es de paiement</strong> : g&eacute;r&eacute;es int&eacute;gralement par Stripe. Nosite ne stocke ni num&eacute;ro de carte, ni donn&eacute;es bancaires.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">3. Base l&eacute;gale</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Donn&eacute;es de compte</strong> : ex&eacute;cution du contrat (article 6.1.b du RGPD).</li>
              <li><strong>Donn&eacute;es de prospection (fiches &eacute;tablissements)</strong> : int&eacute;r&ecirc;t l&eacute;gitime (article 6.1.f). Les donn&eacute;es trait&eacute;es sont exclusivement des coordonn&eacute;es professionnelles publiques (nom commercial, adresse, t&eacute;l&eacute;phone professionnel) publi&eacute;es volontairement par les &eacute;tablissements sur Google Maps.</li>
              <li><strong>Donn&eacute;es d&apos;enrichissement</strong> : donn&eacute;es ouvertes (open data) publi&eacute;es par l&apos;&Eacute;tat fran&ccedil;ais via l&apos;API Recherche Entreprises (data.gouv.fr).</li>
              <li><strong>Analytics</strong> : int&eacute;r&ecirc;t l&eacute;gitime pour l&apos;am&eacute;lioration du service, IP d&eacute;sactiv&eacute;e, donn&eacute;es anonymis&eacute;es.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">4. Dur&eacute;e de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cache Google Places</strong> (nom, adresse, t&eacute;l&eacute;phone, note) : 30 jours en cache Redis, puis purg&eacute; automatiquement.</li>
              <li><strong>Prospects en base</strong> : les donn&eacute;es Google sont anonymis&eacute;es (&laquo; Donn&eacute;es expir&eacute;es &raquo;) apr&egrave;s 30 jours sans rafra&icirc;chissement. Le statut CRM et les notes personnelles sont conserv&eacute;s.</li>
              <li><strong>Donn&eacute;es d&apos;enrichissement</strong> : 7 jours en cache, puis rerequêtées si nécessaire.</li>
              <li><strong>Comptes inactifs</strong> : les comptes sans activit&eacute; depuis plus de 12 mois sont susceptibles d&apos;&ecirc;tre supprim&eacute;s apr&egrave;s notification.</li>
              <li><strong>Place ID</strong> : conserv&eacute; sans limitation (identifiant technique sans donn&eacute;e personnelle).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">5. Droits des utilisateurs (compte Nosite)</h2>
            <p>Conform&eacute;ment au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acc&egrave;s</strong> : consultez vos donn&eacute;es depuis &laquo; Mes prospects &raquo; ou via l&apos;API (<code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">GET /api/v1/prospects</code>).</li>
              <li><strong>Export</strong> : exportez vos prospects au format CSV (interface ou API <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">?format=csv</code>).</li>
              <li><strong>Suppression</strong> : supprimez votre compte et toutes vos donn&eacute;es depuis les param&egrave;tres (Clerk). La suppression est imm&eacute;diate et irr&eacute;versible.</li>
              <li><strong>Opposition</strong> : supprimez les fiches individuelles ou votre compte complet.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">6. Droit d&apos;opposition des personnes prospect&eacute;es (opt-out tiers)</h2>
            <p>Si vous &ecirc;tes le g&eacute;rant d&apos;un &eacute;tablissement r&eacute;f&eacute;renc&eacute; sur Nosite et souhaitez que vos donn&eacute;es soient retir&eacute;es de tous les comptes utilisateurs, vous pouvez exercer votre droit d&apos;opposition :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Par e-mail : <a href="mailto:sofiane.hoummass@icloud.com" className="text-emerald-600 underline">sofiane.hoummass@icloud.com</a> en indiquant le nom et l&apos;adresse de votre &eacute;tablissement.</li>
              <li>Via l&apos;API : <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">POST /api/opt-out</code> avec votre Place ID Google et votre e-mail de contact.</li>
            </ul>
            <p className="mt-2">La suppression est effectu&eacute;e dans un d&eacute;lai de 72 heures. Les donn&eacute;es supprim&eacute;es sont : nom, adresse, t&eacute;l&eacute;phone, notes CRM et statut. Le Place ID seul peut &ecirc;tre conserv&eacute; pour &eacute;viter une r&eacute;indexation.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">7. Sources de donn&eacute;es et conformit&eacute; export</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Maps Platform</strong> : les donn&eacute;es proviennent de l&apos;API Google Places (New). L&apos;export respecte les conditions d&apos;utilisation Google Maps Platform (section 3.2.3) : seul le Place ID est conserv&eacute; durablement, les donn&eacute;es de contenu (nom, adresse, t&eacute;l&eacute;phone) sont cach&eacute;es 30 jours maximum.</li>
              <li><strong>API Recherche Entreprises</strong> : donn&eacute;es ouvertes publi&eacute;es par data.gouv.fr sous Licence Ouverte v2.0. Libre d&apos;utilisation y compris commerciale.</li>
              <li><strong>OpenStreetMap</strong> : donn&eacute;es sous licence ODbL, utilis&eacute;es en repli pour l&apos;autocompl&eacute;tion et la g&eacute;olocalisation. Attribution pr&eacute;sente dans l&apos;interface.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">8. Sous-traitants</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Clerk</strong> : authentification et gestion des sessions (UE/US, certifi&eacute; SOC 2).</li>
              <li><strong>Stripe</strong> : paiement (certifi&eacute; PCI DSS Niveau 1).</li>
              <li><strong>Google Maps Platform</strong> : recherche d&apos;&eacute;tablissements et g&eacute;ocodage.</li>
              <li><strong>Railway</strong> : h&eacute;bergement backend, PostgreSQL, Redis.</li>
              <li><strong>Vercel</strong> : h&eacute;bergement frontend.</li>
              <li><strong>Sentry</strong> : monitoring d&apos;erreurs (PII scrub&eacute;es).</li>
              <li><strong>Mixpanel</strong> : analytics produit (IP d&eacute;sactiv&eacute;e).</li>
              <li><strong>Resend</strong> : e-mails transactionnels.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">9. Cookies</h2>
            <p>Nosite utilise les cookies suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">pw_theme</code> : pr&eacute;f&eacute;rence de th&egrave;me (clair/sombre). Cookie technique, 1 an.</li>
              <li><strong>Cookies Clerk</strong> : session d&apos;authentification. Cookies strictement n&eacute;cessaires.</li>
              <li><strong>Mixpanel</strong> : identifiant analytics stock&eacute; en localStorage (pas un cookie). D&eacute;sactiv&eacute; si <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">NEXT_PUBLIC_MIXPANEL_TOKEN</code> est vide.</li>
            </ul>
            <p className="mt-2">Aucun cookie publicitaire n&apos;est utilis&eacute;.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">10. Contact</h2>
            <p>Pour exercer vos droits, demander la suppression de vos donn&eacute;es ou poser une question : <a href="mailto:sofiane.hoummass@icloud.com" className="text-emerald-600 underline">sofiane.hoummass@icloud.com</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
