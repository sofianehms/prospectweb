import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken, TEST_USER } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.DATABASE_URL = 'mock';
process.env.GOOGLE_DAILY_LIMIT = '9999';
setupAuthEnv();

let searchCount = 0;

vi.mock('../services/planStore', () => ({
  FREE_PLAN_SEARCH_LIMIT: 1,
  FreePlanLimitError: class FreePlanLimitError extends Error {
    constructor() {
      super('Votre recherche gratuite a déjà été utilisée. Passez à un plan payant pour lancer de nouvelles recherches.');
      this.name = 'FreePlanLimitError';
    }
  },
  getUserPlan: vi.fn(async () => ({ id: 'free', name: 'Gratuit', dailyLimit: 1, monthlyPrice: 0, maxProspects: 100 })),
  isFreePlan: vi.fn(() => true),
}));

vi.mock('../services/searchHistory', () => ({
  countUserSearches: vi.fn(async () => searchCount),
  recordSearch: vi.fn(async (userId: string, data: { resultCount: number }) => {
    searchCount++;
    return {
      id: `search-${searchCount}`,
      userId,
      address: '48.85,2.35',
      lat: 48.85,
      lng: 2.35,
      radius: 1000,
      types: 'restaurant',
      resultCount: data.resultCount,
      createdAt: new Date().toISOString(),
    };
  }),
  getKnownPlaceIds: vi.fn(async () => new Set<string>()),
}));

vi.mock('../services/cache', () => ({
  cacheKey: vi.fn(() => 'test-cache-key'),
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));

vi.mock('../services/places', () => ({
  COMMERCIAL_TYPES: ['restaurant'],
  getBreakerStatus: vi.fn(async () => ({ isOpen: false, consecutiveFailures: 0, openUntil: null })),
  nearbySearch: vi.fn(async () => ({
    places: [],
    apiCalls: 0,
    meta: { partial: false, cappedTypes: [], failedTypes: [] },
  })),
  GoogleApiError: class GoogleApiError extends Error {
    constructor(public status: number, public body: string) {
      super(`Google API ${status}: ${body}`);
    }
  },
}));

import { app } from '../index';

const SECRET = 'test-secret';
const TOKEN = testToken();

describe('Free plan search limit', () => {
  beforeEach(() => {
    searchCount = 0;
  });

  it('consomme la recherche gratuite puis bloque la suivante', async () => {
    const first = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(first.status).toBe(200);
    expect(searchCount).toBe(1);

    const second = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(second.status).toBe(402);
    expect(second.body.error).toContain('recherche gratuite');
    expect(searchCount).toBe(1);
    expect(TEST_USER.sub).toBeDefined();
  });
});
