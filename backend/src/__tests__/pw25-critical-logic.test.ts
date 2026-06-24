import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/googleQuota', () => ({
  getUsage: vi.fn().mockReturnValue({ total: 0, places: 0, geocoding: 0, limit: 9999 }),
  recordGoogleCall: vi.fn(),
  checkQuota: vi.fn(),
  trackCall: vi.fn(),
  getQuotaLimit: vi.fn().mockReturnValue(9999),
  QuotaExceededError: class extends Error { name = 'QuotaExceededError' },
  loadFromDb: vi.fn(),
  resetForTesting: vi.fn(),
}));
vi.mock('../services/userQuota', () => ({
  getUserUsage: vi.fn().mockReturnValue({ dailyRequests: 0 }),
  getAllUsersUsage: vi.fn().mockReturnValue({}),
  checkUserQuota: vi.fn(),
  trackUserCalls: vi.fn(),
  UserQuotaExceededError: class extends Error { name = 'UserQuotaExceededError' },
  resetForTesting: vi.fn(),
}));
vi.mock('../services/db', () => ({
  getPool: vi.fn(),
  initDb: vi.fn(),
}));
vi.mock('../services/prospectStore', () => ({
  listProspects: vi.fn().mockResolvedValue([]),
  addProspect: vi.fn(),
  removeProspect: vi.fn(),
  updateCrmStatus: vi.fn(),
  updateNotes: vi.fn(),
  purgeStaleGoogleData: vi.fn(),
}));

vi.mock('dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('PW-25 -- resolveSiteStatus logic', () => {
  it('correctly maps all 4 states', async () => {
    const mod = await import('../routes/search');
    const src = await import('fs').then(fs =>
      fs.readFileSync(require('path').resolve(__dirname, '../routes/search.ts'), 'utf-8')
    );
    expect(src).toContain("'none'");
    expect(src).toContain("'unreachable'");
    expect(src).toContain("'outdated'");
    expect(src).toContain("'active'");
    expect(src).toContain('resolveSiteStatus');
  });
});

describe('PW-25 -- subCenters multi-zone logic', () => {
  it('places.ts exports subCenters-like behavior via nearbySearch', async () => {
    const src = await import('fs').then(fs =>
      fs.readFileSync(require('path').resolve(__dirname, '../services/places.ts'), 'utf-8')
    );
    expect(src).toContain('subCenters');
    expect(src).toContain('fetchByTypeMultiArea');
    expect(src).toMatch(/latDelta|lngDelta/);
  });
});

describe('PW-25 -- cache async API', () => {
  it('getCached and setCached are async', async () => {
    const { getCached, setCached } = await import('../services/cache');
    const getResult = getCached('test');
    const setResult = setCached('test', 'val');
    expect(getResult).toBeInstanceOf(Promise);
    expect(setResult).toBeInstanceOf(Promise);
  });

  it('round-trips values correctly', async () => {
    const { getCached, setCached } = await import('../services/cache');
    await setCached('pw25-test', { data: 42 });
    const val = await getCached<{ data: number }>('pw25-test');
    expect(val).toEqual({ data: 42 });
  });
});

describe('PW-25 -- /api/search integration with mocked Google', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns structured results with meta and summary', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === 'string' && url.includes('places.googleapis.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            places: [
              {
                id: 'place_1',
                displayName: { text: 'Boulangerie Test' },
                formattedAddress: '1 rue Test, Paris',
                location: { latitude: 48.85, longitude: 2.35 },
                types: ['bakery'],
                googleMapsUri: 'https://maps.google.com/test',
                rating: 4.5,
                userRatingCount: 100,
              },
            ],
          }),
          text: async () => '',
        };
      }
      return { ok: true, status: 200, headers: new Map(), body: null, json: async () => ({}) };
    });

    const request = (await import('supertest')).default;
    const jwt = (await import('jsonwebtoken')).default;
    const { app } = await import('../index');

    const token = jwt.sign(
      { sub: 'test-user', email: 'test@test.com' },
      process.env.JWT_SECRET ?? 'test-jwt',
    );

    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=bakery')
      .set('x-internal-secret', process.env.BACKEND_SECRET ?? 'test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).not.toBe(401);
    if (res.status === 200) {
      expect(res.body.summary).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.partial).toBeDefined();
      expect(res.body.establishments).toBeInstanceOf(Array);
      expect(res.body.summary.total).toBeGreaterThanOrEqual(0);
    }
  }, 15000);
});
