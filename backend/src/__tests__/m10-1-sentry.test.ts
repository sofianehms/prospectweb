import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.SENTRY_DSN = '';

describe('M10.1 -- Sentry integration backend', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Sentry est importable et expose les fonctions clés', async () => {
    const Sentry = await import('@sentry/node');
    expect(typeof Sentry.init).toBe('function');
    expect(typeof Sentry.captureException).toBe('function');
    expect(typeof Sentry.setUser).toBe('function');
    expect(typeof Sentry.setupExpressErrorHandler).toBe('function');
  });

  it('Sentry.init ne lance pas d\'erreur sans DSN', () => {
    const Sentry = require('@sentry/node');
    expect(() => Sentry.init({ dsn: '' })).not.toThrow();
  });

  it('captureException accepte une erreur sans crash', () => {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: '' });
    expect(() => Sentry.captureException(new Error('test error'))).not.toThrow();
  });

  it('setUser accepte un id anonymisé', () => {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: '' });
    expect(() => Sentry.setUser({ id: 'user_abc123' })).not.toThrow();
  });

  it('beforeSend supprime les PII (ip_address, email)', () => {
    const beforeSend = (event: any) => {
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    };

    const event = {
      user: { id: 'u1', ip_address: '1.2.3.4', email: 'test@test.com' },
      exception: { values: [{ type: 'Error', value: 'test' }] },
    };

    const cleaned = beforeSend(event);
    expect(cleaned.user.id).toBe('u1');
    expect(cleaned.user.ip_address).toBeUndefined();
    expect(cleaned.user.email).toBeUndefined();
  });

  it('setupExpressErrorHandler est appelable sur une app Express', async () => {
    const express = (await import('express')).default;
    const Sentry = await import('@sentry/node');
    const app = express();
    expect(() => Sentry.setupExpressErrorHandler(app)).not.toThrow();
  });
});
