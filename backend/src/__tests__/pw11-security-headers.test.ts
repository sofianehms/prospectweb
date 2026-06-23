import { describe, it, expect, vi } from 'vitest';
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

import { app } from '../index';

describe('PW-11 -- helmet security headers', () => {
  it('sets X-Content-Type-Options', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('sets Content-Security-Policy', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('sets Strict-Transport-Security', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
  });
});

describe('PW-11 -- constant-time secret comparison uses timingSafeEqual', () => {
  it('auth module imports timingSafeEqual from crypto', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../middleware/auth.ts'),
      'utf-8',
    );
    expect(src).toContain('timingSafeEqual');
    expect(src).not.toMatch(/provided\s*!==\s*expected/);
  });
});
