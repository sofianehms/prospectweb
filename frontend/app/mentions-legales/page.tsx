import Link from 'next/link'
import AppHeader from '@/app/components/AppHeader'

export const metadata = {
  title: 'Mentions légales — Nosite',
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <AppHeader>
        <Link href="/" className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition">
          Accueil
        </Link>
      </AppHeader>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Mentions légales</h1>
          <p className="text-gray-500 dark:text-slate-400">Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l&apos;Économie Numérique (LCEN).</p>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">1. Éditeur du site</h2>
            <ul className="space-y-1">
              <li><strong>Nom :</strong> Sofiane H.</li>
              <li><strong>Statut :</strong> Auto-entrepreneur (micro-entreprise)</li>
              <li><strong>SIRET :</strong> 942 973 546 00016</li>
              <li><strong>Adresse :</strong> <span className="italic text-gray-400 dark:text-slate-500">34 Avenue des Champs-Elysées, 75008 Paris</span></li>
              <li><strong>E-mail :</strong> <a href="mailto:contact@nosite.fr" className="text-emerald-600 underline">contact@nosite.fr</a></li>
              <li><strong>TVA :</strong> TVA non applicable — article 293 B du CGI (franchise en base)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">2. Directeur de la publication</h2>
            <p>Sofiane H.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">3. Hébergement</h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Frontend</p>
                <ul className="space-y-0.5 mt-1">
                  <li><strong>Société :</strong> Vercel Inc.</li>
                  <li><strong>Adresse :</strong> 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</li>
                  <li><strong>Site :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">vercel.com</a></li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-slate-100">Backend, base de données et cache</p>
                <ul className="space-y-0.5 mt-1">
                  <li><strong>Société :</strong> Railway Corp.</li>
                  <li><strong>Adresse :</strong> 548 Market St PMB 68957, San Francisco, CA 94104, États-Unis</li>
                  <li><strong>Site :</strong> <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">railway.app</a></li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">4. Propriété intellectuelle</h2>
            <p>Le site Nosite et l&apos;ensemble de ses contenus (textes, images, interface, logo, code source) sont protégés par le droit d&apos;auteur et sont la propriété exclusive de Sofiane H., sauf mentions contraires.</p>
            <p className="mt-2">Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">5. Sources de données tierces</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Maps Platform</strong> — données d&apos;établissements issues de l&apos;API Google Places. Utilisation soumise aux <a href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">conditions d&apos;utilisation Google Maps Platform</a>.</li>
              <li><strong>API Recherche Entreprises</strong> — données SIRET/SIREN publiées par l&apos;État français via data.gouv.fr sous Licence Ouverte v2.0.</li>
              <li><strong>OpenStreetMap</strong> — données cartographiques sous licence ODbL. © Contributeurs OpenStreetMap.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">6. Données personnelles et cookies</h2>
            <p>Les informations relatives au traitement des données personnelles et à l&apos;utilisation des cookies sont disponibles dans notre <Link href="/privacy" className="text-emerald-600 underline">Politique de confidentialité</Link>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">7. Liens hypertextes</h2>
            <p>Le site Nosite peut contenir des liens vers des sites tiers. Ces liens sont fournis à titre informatif. Nosite ne saurait être tenu responsable du contenu de ces sites ni des dommages pouvant résulter de leur consultation.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">8. Contact</h2>
            <p>Pour toute question ou signalement : <a href="mailto:contact@nosite.fr" className="text-emerald-600 underline">contact@nosite.fr</a></p>
          </section>

        </div>
      </main>
    </div>
  )
}
