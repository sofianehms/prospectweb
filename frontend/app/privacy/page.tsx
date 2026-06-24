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
          <p className="text-gray-500 dark:text-slate-400">Derni&egrave;re mise &agrave; jour : 24 juin 2026</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">1. Responsable du traitement</h2>
            <p>ProspectWeb est un outil de prospection commerciale B2B. Le responsable du traitement est l&apos;exploitant de l&apos;instance d&eacute;ploy&eacute;e.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">2. Donn&eacute;es collect&eacute;es</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Donn&eacute;es de compte</strong> : adresse e-mail et mot de passe (hash&eacute; bcrypt).</li>
              <li><strong>Donn&eacute;es de prospection</strong> : fiches d&apos;&eacute;tablissements issus de Google Places (nom, adresse, t&eacute;l&eacute;phone, note), statut CRM et notes personnelles.</li>
              <li><strong>Donn&eacute;es d&apos;usage</strong> : compteurs de requ&ecirc;tes journaliers (pas de tracking comportemental).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">3. Base l&eacute;gale</h2>
            <p>Le traitement repose sur l&apos;<strong>int&eacute;r&ecirc;t l&eacute;gitime</strong> de l&apos;utilisateur (prospection commerciale B2B pour son propre compte). Les donn&eacute;es de professionnels sont trait&eacute;es dans le cadre de leur activit&eacute; publique (article 6.1.f du RGPD).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">4. Dur&eacute;e de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Donn&eacute;es Google Places</strong> (nom, adresse, t&eacute;l&eacute;phone, note) : 30 jours maximum, puis purg&eacute;es automatiquement. Seul le Place ID est conserv&eacute; durablement.</li>
              <li><strong>Donn&eacute;es utilisateur</strong> (statut CRM, notes) : conserv&eacute;es tant que le compte est actif.</li>
              <li><strong>Comptes inactifs</strong> : les comptes sans activit&eacute; ni prospects depuis plus de 12 mois sont supprim&eacute;s automatiquement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">5. Vos droits</h2>
            <p>Conform&eacute;ment au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acc&egrave;s</strong> : consultez vos donn&eacute;es depuis la page &laquo; Mes prospects &raquo;.</li>
              <li><strong>Suppression</strong> : supprimez votre compte et toutes vos donn&eacute;es depuis les param&egrave;tres. La suppression est imm&eacute;diate et irr&eacute;versible.</li>
              <li><strong>Export</strong> : exportez vos prospects au format CSV.</li>
              <li><strong>Opposition</strong> : supprimez les fiches individuelles ou votre compte complet.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">6. Sous-traitants</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Maps Platform</strong> : recherche d&apos;&eacute;tablissements et g&eacute;ocodage.</li>
              <li><strong>Railway</strong> : h&eacute;bergement du backend, de la base de donn&eacute;es PostgreSQL et du cache Redis.</li>
              <li><strong>Vercel</strong> : h&eacute;bergement du frontend.</li>
              <li><strong>OpenStreetMap / Nominatim</strong> : autocompl&eacute;tion d&apos;adresses (via proxy backend).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">7. Cookies</h2>
            <p>ProspectWeb utilise un unique cookie technique (<code className="text-xs bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded">pw_token</code>) pour maintenir la session d&apos;authentification. Aucun cookie publicitaire ni de tracking n&apos;est utilis&eacute;.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">8. Contact</h2>
            <p>Pour exercer vos droits ou poser une question : <a href="mailto:sofiane.hoummass@icloud.com" className="text-emerald-600 underline">sofiane.hoummass@icloud.com</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
