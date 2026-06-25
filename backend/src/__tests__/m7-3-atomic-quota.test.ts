import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackCall,
  checkQuota,
  getUsage,
  resetForTesting as resetGoogleQuota,
  QuotaExceededError,
} from '../services/googleQuota';
import {
  trackUserCalls,
  checkUserQuota,
  getUserUsage,
  resetForTesting as resetUserQuota,
  UserQuotaExceededError,
} from '../services/userQuota';

process.env.GOOGLE_DAILY_LIMIT = '20';
process.env.USER_DAILY_LIMIT = '10';
process.env.NODE_ENV = 'test';

describe('M7.3 -- compteurs Google partagés (fallback mémoire)', () => {
  beforeEach(() => {
    resetGoogleQuota();
  });

  it('le compteur places et geocoding sont additionnés pour le quota', () => {
    trackCall('places', 12);
    trackCall('geocoding', 7);
    expect(getUsage().total).toBe(19);
    expect(() => checkQuota(2)).toThrow(QuotaExceededError);
    expect(() => checkQuota(1)).not.toThrow();
  });

  it('des appels concurrents depuis le même processus convergent', () => {
    for (let i = 0; i < 10; i++) {
      trackCall('places', 1);
      trackCall('geocoding', 1);
    }
    expect(getUsage().total).toBe(20);
    expect(() => checkQuota(1)).toThrow(QuotaExceededError);
  });

  it('le dépassement bloque quel que soit le service', () => {
    trackCall('places', 15);
    trackCall('geocoding', 5);
    expect(() => checkQuota(1)).toThrow(QuotaExceededError);
  });

  it('resetForTesting remet tout à zéro', () => {
    trackCall('places', 10);
    resetGoogleQuota();
    expect(getUsage().total).toBe(0);
    expect(() => checkQuota(1)).not.toThrow();
  });
});

describe('M7.3 -- compteurs utilisateur partagés (fallback mémoire)', () => {
  beforeEach(() => {
    resetUserQuota();
  });

  it('les appels utilisateur sont comptabilisés et plafonnés', () => {
    trackUserCalls('user-a', 5);
    trackUserCalls('user-a', 4);
    expect(getUserUsage('user-a').calls).toBe(9);
    expect(() => checkUserQuota('user-a', 1)).not.toThrow();
    trackUserCalls('user-a', 1);
    expect(() => checkUserQuota('user-a', 1)).toThrow(UserQuotaExceededError);
  });

  it('les compteurs sont isolés par utilisateur', () => {
    trackUserCalls('user-a', 8);
    trackUserCalls('user-b', 3);
    expect(getUserUsage('user-a').calls).toBe(8);
    expect(getUserUsage('user-b').calls).toBe(3);
    expect(() => checkUserQuota('user-b', 7)).not.toThrow();
    expect(() => checkUserQuota('user-a', 3)).toThrow(UserQuotaExceededError);
  });

  it('des incréments concurrents convergent', () => {
    const promises: void[] = [];
    for (let i = 0; i < 10; i++) {
      trackUserCalls('user-c', 1);
    }
    expect(getUserUsage('user-c').calls).toBe(10);
    expect(() => checkUserQuota('user-c', 1)).toThrow(UserQuotaExceededError);
  });
});
