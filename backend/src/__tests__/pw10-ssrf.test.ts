import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { isPrivateIp } from '../services/websiteChecker';

vi.mock('dns/promises', () => ({
  lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }),
}));

import { lookup } from 'dns/promises';
const mockedLookup = vi.mocked(lookup);

describe('PW-10 -- isPrivateIp bloque les plages privees', () => {
  const blocked = [
    '127.0.0.1',
    '127.0.0.2',
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.0.1',
    '192.168.1.100',
    '169.254.169.254',
    '0.0.0.0',
  ];

  const allowed = [
    '8.8.8.8',
    '1.1.1.1',
    '142.250.74.206',
    '172.32.0.1',
    '11.0.0.1',
    '192.169.0.1',
  ];

  for (const ip of blocked) {
    it(`bloque ${ip}`, () => {
      expect(isPrivateIp(ip)).toBe(true);
    });
  }

  for (const ip of allowed) {
    it(`autorise ${ip}`, () => {
      expect(isPrivateIp(ip)).toBe(false);
    });
  }
});

describe('PW-10 -- isPrivateIp gere les adresses IPv6', () => {
  it('bloque ::1 (loopback)', () => {
    expect(isPrivateIp('::1')).toBe(true);
  });

  it('bloque :: (unspecified)', () => {
    expect(isPrivateIp('::')).toBe(true);
  });

  it('bloque fe80:: (link-local)', () => {
    expect(isPrivateIp('fe80::1')).toBe(true);
  });

  it('bloque fd00:: (ULA)', () => {
    expect(isPrivateIp('fd12:3456::1')).toBe(true);
  });
});

describe('PW-10 -- checkWebsite bloque les URL vers IP privees', () => {
  it('bloque une IP privee directe', async () => {
    const { checkWebsite } = await import('../services/websiteChecker');
    const result = await checkWebsite('http://192.168.1.1/admin');
    expect(result.reachable).toBe(false);
    expect(result.error).toContain('bloquée');
  });

  it('bloque le endpoint de metadonnees cloud', async () => {
    const { checkWebsite } = await import('../services/websiteChecker');
    const result = await checkWebsite('http://169.254.169.254/latest/meta-data/');
    expect(result.reachable).toBe(false);
    expect(result.error).toContain('bloquée');
  });

  it('bloque localhost', async () => {
    const { checkWebsite } = await import('../services/websiteChecker');
    const result = await checkWebsite('http://127.0.0.1:3000');
    expect(result.reachable).toBe(false);
    expect(result.error).toContain('bloquée');
  });
});

describe('PW-10 -- checkWebsite bloque les redirections vers IP privees', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    mockedLookup.mockReset();
    mockedLookup.mockResolvedValue({ address: '93.184.216.34', family: 4 });
  });

  it('bloque une redirection vers une IP privee', async () => {
    mockedLookup.mockResolvedValue({ address: '93.184.216.34', family: 4 });

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          status: 302,
          headers: new Headers({ location: 'http://10.0.0.1/internal' }),
        });
      }
      return Promise.resolve({
        status: 200,
        headers: new Headers(),
        body: null,
      });
    });

    const { checkWebsite } = await import('../services/websiteChecker');
    const result = await checkWebsite('http://evil-redirect.com');
    expect(result.reachable).toBe(false);
    expect(result.error).toContain('bloquée');
  });

  it('suit les redirections vers des IP publiques', async () => {
    mockedLookup.mockResolvedValue({ address: '93.184.216.34', family: 4 });

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          status: 301,
          headers: new Headers({ location: 'http://safe.example.com/page' }),
        });
      }
      return Promise.resolve({
        status: 200,
        headers: new Headers(),
        body: null,
      });
    });

    const { checkWebsite } = await import('../services/websiteChecker');
    const result = await checkWebsite('http://redirect-safe.com');
    expect(result.reachable).toBe(true);
    expect(result.statusCode).toBe(200);
  });
});
