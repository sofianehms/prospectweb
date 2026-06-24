import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MAX_CONCURRENT } from '../services/websiteChecker';

vi.mock('dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { checkWebsite } from '../services/websiteChecker';

describe('PW-15 -- concurrency pool for website checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MAX_CONCURRENT defaults to 5', () => {
    expect(MAX_CONCURRENT).toBe(5);
  });

  it('limits concurrent fetches to MAX_CONCURRENT', async () => {
    let peakConcurrent = 0;
    let currentConcurrent = 0;

    mockFetch.mockImplementation(() => {
      currentConcurrent++;
      peakConcurrent = Math.max(peakConcurrent, currentConcurrent);
      return new Promise(resolve => {
        setTimeout(() => {
          currentConcurrent--;
          resolve({
            status: 200,
            ok: true,
            headers: new Map([['last-modified', null]]),
            body: null,
          });
        }, 50);
      });
    });

    const urls = Array.from({ length: 12 }, (_, i) => `https://site${i}.com`);
    await Promise.all(urls.map(u => checkWebsite(u)));

    expect(peakConcurrent).toBeLessThanOrEqual(MAX_CONCURRENT);
    expect(peakConcurrent).toBeGreaterThan(0);
  });

  it('all requests eventually complete even when queue is full', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Map([['last-modified', null]]),
      body: null,
    });

    const urls = Array.from({ length: 10 }, (_, i) => `https://queued${i}.com`);
    const results = await Promise.all(urls.map(u => checkWebsite(u)));

    expect(results).toHaveLength(10);
    results.forEach(r => expect(r.reachable).toBe(true));
  });

  it('releases slot even on error', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const urls = Array.from({ length: 8 }, (_, i) => `https://fail${i}.com`);
    const results = await Promise.all(urls.map(u => checkWebsite(u)));

    expect(results).toHaveLength(8);
    results.forEach(r => {
      expect(r.reachable).toBe(false);
      expect(r.error).toBeTruthy();
    });
  });
});
