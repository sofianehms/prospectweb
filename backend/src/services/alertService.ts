import Redis from 'ioredis';

export type AlertType =
  | 'circuit_breaker_open'
  | 'google_quota_80'
  | 'google_quota_100'
  | 'google_api_error'
  | 'payment_failed';

const COOLDOWN_SECONDS: Record<AlertType, number> = {
  circuit_breaker_open: 300,
  google_quota_80: 3600,
  google_quota_100: 3600,
  google_api_error: 600,
  payment_failed: 1800,
};

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    return new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
  } catch { return null; }
}

async function isDuplicate(alertType: AlertType): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const key = `alert:cooldown:${alertType}`;
    const exists = await r.exists(key);
    if (exists) { r.quit().catch(() => {}); return true; }
    await r.set(key, '1', 'EX', COOLDOWN_SECONDS[alertType]);
    r.quit().catch(() => {});
    return false;
  } catch {
    r.quit().catch(() => {});
    return false;
  }
}

function getAlertEmail(): string | null {
  return process.env.ALERT_EMAIL ?? null;
}

export async function sendAlert(
  alertType: AlertType,
  subject: string,
  details: string,
): Promise<void> {
  if (await isDuplicate(alertType)) {
    console.log(`[alert] ${alertType} supprime (cooldown actif)`);
    return;
  }

  console.warn(`[ALERT] ${alertType}: ${subject} — ${details}`);

  const email = getAlertEmail();
  if (!email) return;

  try {
    const { Resend } = await import('resend');
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    const resend = new Resend(key);
    const from = process.env.RESEND_FROM ?? 'Nosite <onboarding@resend.dev>';

    await resend.emails.send({
      from,
      to: email,
      subject: `[Nosite Alerte] ${subject}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#09090B;">
          <div style="padding:16px;background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;margin-bottom:16px;">
            <h2 style="font-size:18px;font-weight:700;color:#DC2626;margin:0 0 8px;">${subject}</h2>
            <p style="font-size:14px;color:#52525B;margin:0;line-height:1.6;">${details}</p>
          </div>
          <p style="font-size:12px;color:#A1A1AA;">
            Type : ${alertType} — ${new Date().toISOString()}<br>
            Prochaine alerte identique possible dans ${COOLDOWN_SECONDS[alertType] / 60} min.
          </p>
        </div>
      `,
    });

    console.log(`[alert] Email envoye a ${email}: ${subject}`);
  } catch (err) {
    console.error('[alert] Echec envoi email:', (err as Error).message);
  }
}
