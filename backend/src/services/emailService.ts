import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

function getFrom(): string {
  return process.env.RESEND_FROM ?? 'Nosite <onboarding@resend.dev>';
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY absent, email non envoye');
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: getFrom(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[email] Echec envoi a ${to}: ${error.message}`);
      return;
    }

    console.log(`[email] Envoye a ${to}: ${subject}`);
  } catch (err) {
    console.error(`[email] Erreur envoi a ${to}:`, (err as Error).message);
  }
}

// ── Templates ──────────────────────────────────────────────────────────────────

const FOOTER = `
  <p style="margin-top:32px;font-size:12px;color:#71717A;">
    Nosite — nosite.fr<br>
    Cet email a ete envoye automatiquement, merci de ne pas y repondre.
  </p>
`;

function wrap(content: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#09090B;">
      ${content}
      ${FOOTER}
    </div>
  `;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = wrap(`
    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">Bienvenue sur Nosite, ${name}</h1>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Votre compte a bien ete cree. Vous pouvez des maintenant lancer votre premiere recherche
      et identifier des prospects sans site web.
    </p>
    <a href="https://nosite.fr/search" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
      Lancer une recherche
    </a>
  `);
  await send(to, 'Bienvenue sur Nosite', html);
}

export async function sendPaymentConfirmationEmail(
  to: string,
  planName: string,
  amount: string,
): Promise<void> {
  const html = wrap(`
    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">Paiement confirme</h1>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Votre abonnement <strong>${planName}</strong> est maintenant actif.
      Montant : <strong>${amount}</strong>.
    </p>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Vous pouvez consulter vos factures et gerer votre abonnement depuis votre espace facturation.
    </p>
    <a href="https://nosite.fr/account/billing" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
      Voir ma facturation
    </a>
  `);
  await send(to, `Paiement confirme — ${planName}`, html);
}

export async function sendInvoiceEmail(
  to: string,
  amount: string,
  invoiceUrl: string | null,
): Promise<void> {
  const linkHtml = invoiceUrl
    ? `<a href="${invoiceUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Voir la facture</a>`
    : '';
  const html = wrap(`
    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">Nouvelle facture</h1>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Une facture de <strong>${amount}</strong> a ete emise pour votre abonnement Nosite.
    </p>
    ${linkHtml}
  `);
  await send(to, `Facture Nosite — ${amount}`, html);
}

export async function sendPlanExpirationEmail(
  to: string,
  planName: string,
): Promise<void> {
  const html = wrap(`
    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">Abonnement expire</h1>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Votre abonnement <strong>${planName}</strong> a expire.
      Votre compte est repasse sur le plan Gratuit avec un quota reduit.
    </p>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Pour retrouver vos limites etendues, reactivez votre abonnement.
    </p>
    <a href="https://nosite.fr/settings" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
      Reactiver mon abonnement
    </a>
  `);
  await send(to, `Abonnement ${planName} expire`, html);
}

export async function sendQuotaReachedEmail(
  to: string,
  usage: number,
  limit: number,
): Promise<void> {
  const html = wrap(`
    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">Quota journalier atteint</h1>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Vous avez utilise <strong>${usage}/${limit}</strong> appels aujourd'hui.
      Votre quota sera reinitialise demain a minuit.
    </p>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Besoin de plus ? Passez a un plan superieur pour augmenter votre quota.
    </p>
    <a href="https://nosite.fr/settings" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#16A34A;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
      Voir les plans
    </a>
  `);
  await send(to, 'Quota journalier atteint — Nosite', html);
}

export async function sendPaymentFailedEmail(
  to: string,
  amount: string,
  reason: string,
): Promise<void> {
  const html = wrap(`
    <h1 style="font-size:22px;font-weight:700;margin-bottom:8px;">Echec de paiement</h1>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Le paiement de <strong>${amount}</strong> pour votre abonnement Nosite a echoue.
    </p>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Motif : ${reason}
    </p>
    <p style="font-size:14px;color:#52525B;line-height:1.6;">
      Mettez a jour votre moyen de paiement pour eviter l'interruption de votre abonnement.
    </p>
    <a href="https://nosite.fr/account/billing" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
      Mettre a jour mon paiement
    </a>
  `);
  await send(to, 'Echec de paiement — Nosite', html);
}
