import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../services/googleQuota', () => ({
  getUsage: vi.fn().mockReturnValue({ totalRequests: 0 }),
  recordGoogleCall: vi.fn(),
}));
vi.mock('../services/userQuota', () => ({
  getUserUsage: vi.fn().mockReturnValue({ dailyRequests: 0 }),
  getAllUsersUsage: vi.fn().mockReturnValue({}),
  checkAndRecordUsage: vi.fn().mockReturnValue(true),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { app } from '../index';

const SECRET = process.env.BACKEND_SECRET ?? 'test';

describe('PW-12 -- Nominatim proxy /api/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BACKEND_SECRET = SECRET;
  });

  it('returns empty array when query is too short', async () => {
    const res = await request(app)
      .get('/api/autocomplete?q=a')
      .set('x-internal-secret', SECRET);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('proxies to Nominatim with correct User-Agent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ display_name: 'Paris', lat: '48.8', lon: '2.3' }]),
    });

    const res = await request(app)
      .get('/api/autocomplete?q=Paris')
      .set('x-internal-secret', SECRET);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].display_name).toBe('Paris');

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('nominatim.openstreetmap.org');
    expect(url).toContain('q=Paris');
    expect(opts.headers['User-Agent']).toMatch(/Nosite/);
    expect(opts.headers['Accept-Language']).toBe('fr');
  });

  it('returns cached results on second call', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ display_name: 'Lyon', lat: '45.7', lon: '4.8' }]),
    });

    await request(app)
      .get('/api/autocomplete?q=Lyon')
      .set('x-internal-secret', SECRET);

    const res2 = await request(app)
      .get('/api/autocomplete?q=Lyon')
      .set('x-internal-secret', SECRET);

    expect(res2.body[0].display_name).toBe('Lyon');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects requests without internal secret', async () => {
    const res = await request(app).get('/api/autocomplete?q=Marseille');
    expect(res.status).toBe(401);
  });
});

describe('PW-12 -- frontend no longer calls Nominatim directly', () => {
  it('SearchForm.tsx does not reference nominatim.openstreetmap.org', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../frontend/app/components/SearchForm.tsx'),
      'utf-8',
    );
    expect(src).not.toContain('nominatim.openstreetmap.org');
    expect(src).toContain('/api/autocomplete');
  });
});
