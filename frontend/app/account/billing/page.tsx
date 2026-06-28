import { redirect } from 'next/navigation'

// La facturation vit désormais dans la page Paramètres (onglet Abonnement).
export default function BillingRedirect() {
  redirect('/settings?tab=abonnement')
}
