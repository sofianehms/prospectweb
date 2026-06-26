import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = '';
process.env.RESEND_API_KEY = '';
process.env.ALERT_EMAIL = '';

describe('M10.4 -- Service d\'alerte exploitant', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('sendAlert est importable et ne crash pas sans config', async () => {
    const { sendAlert } = await import('../services/alertService');
    await expect(
      sendAlert('circuit_breaker_open', 'Test', 'Details de test'),
    ).resolves.not.toThrow();
  });

  it('sendAlert avec ALERT_EMAIL mais sans RESEND_API_KEY ne crash pas', async () => {
    process.env.ALERT_EMAIL = 'test@test.com';
    const { sendAlert } = await import('../services/alertService');
    await expect(
      sendAlert('google_quota_80', 'Quota 80%', '400/500 appels'),
    ).resolves.not.toThrow();
    process.env.ALERT_EMAIL = '';
  });

  it('les types d\'alerte couvrent les cas requis', async () => {
    const { sendAlert } = await import('../services/alertService');
    const types = [
      'circuit_breaker_open',
      'google_quota_80',
      'google_quota_100',
      'google_api_error',
      'payment_failed',
    ] as const;

    for (const t of types) {
      await expect(sendAlert(t, 'test', 'details')).resolves.not.toThrow();
    }
  });

  it('le seuil 80% dans googleQuota declenche un log d\'alerte', async () => {
    const { resetForTesting, trackCall } = await import('../services/googleQuota');
    resetForTesting();
    process.env.GOOGLE_DAILY_LIMIT = '10';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    trackCall('places', 8);

    const warnCalls = warnSpy.mock.calls.map(c => String(c[0]));
    expect(warnCalls.some(c => c.includes('80%'))).toBe(true);

    warnSpy.mockRestore();
    process.env.GOOGLE_DAILY_LIMIT = '500';
    resetForTesting();
  });
});
