import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { checkWebsite } from '../services/websiteChecker';

describe('PW-16 -- confidence score & signal separation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unreachable site returns score 0 and reachable=false', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await checkWebsite('https://down.example.com');
    expect(result.reachable).toBe(false);
    expect(result.confidenceScore).toBe(0);
    expect(result.confidenceSignals).toEqual([]);
  });

  it('reachable site with no recent signals returns low score', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['last-modified', null]]),
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode('<html><body>Old page</body></html>'));
          ctrl.close();
        },
      }),
    });
    const result = await checkWebsite('https://old-site.com');
    expect(result.reachable).toBe(true);
    expect(result.confidenceScore).toBeLessThan(30);
    expect(result.hasRecentContent).toBe(false);
  });

  it('reachable site with recent year gets score from year signal', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['last-modified', null]]),
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode(`<html><footer>Copyright 2026</footer></html>`));
          ctrl.close();
        },
      }),
    });
    const result = await checkWebsite('https://year-site.com');
    expect(result.reachable).toBe(true);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(10);
    expect(result.confidenceSignals.find(s => s.name.includes('Année'))?.found).toBe(true);
  });

  it('reachable site with Last-Modified header gets high score', async () => {
    const recent = new Date(Date.now() - 30 * 86400000).toUTCString();
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['last-modified', recent]]),
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode('<html><body>Fresh</body></html>'));
          ctrl.close();
        },
      }),
    });
    const result = await checkWebsite('https://fresh-site.com');
    expect(result.reachable).toBe(true);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(30);
    expect(result.hasRecentContent).toBe(true);
    expect(result.confidenceSignals.find(s => s.name.includes('Last-Modified'))?.found).toBe(true);
  });

  it('signals include all expected categories', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['last-modified', null]]),
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode('<html></html>'));
          ctrl.close();
        },
      }),
    });
    const result = await checkWebsite('https://any-site.com');
    const names = result.confidenceSignals.map(s => s.name);
    expect(names).toContain('Last-Modified récent');
    expect(names).toContain('Référence sitemap.xml');
    expect(names).toContain('Framework moderne détecté');
  });

  it('modern framework detected boosts score', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['last-modified', null]]),
      body: new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(new TextEncoder().encode('<html><script src="/_next/static/chunks/main.js"></script></html>'));
          ctrl.close();
        },
      }),
    });
    const result = await checkWebsite('https://nextjs-site.com');
    expect(result.confidenceSignals.find(s => s.name.includes('Framework'))?.found).toBe(true);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(10);
  });
});
