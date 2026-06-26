import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/googleQuota', () => ({
  getUsage: vi.fn().mockReturnValue({ totalRequests: 0 }),
  recordGoogleCall: vi.fn(),
}));
vi.mock('../services/userQuota', () => ({
  getUserUsage: vi.fn().mockReturnValue({ dailyRequests: 0 }),
  getAllUsersUsage: vi.fn().mockReturnValue({}),
  checkAndRecordUsage: vi.fn().mockReturnValue(true),
}));
vi.mock('../services/db', () => ({
  getPool: vi.fn(),
  initDb: vi.fn(),
}));
vi.mock('../services/prospectStore', () => ({
  listProspects: vi.fn().mockResolvedValue([
    { id: 'p1', userId: 'u1', name: 'Test', address: '1 rue A', type: 'restaurant', crmStatus: 'to_contact', notes: '', addedAt: '2026-01-01' },
  ]),
  addProspect: vi.fn().mockResolvedValue(
    { id: 'p2', userId: 'u1', name: 'New', address: '2 rue B', type: 'cafe', crmStatus: 'to_contact', notes: '', addedAt: '2026-01-02' },
  ),
  removeProspect: vi.fn().mockResolvedValue(true),
  updateCrmStatus: vi.fn().mockResolvedValue(
    { id: 'p1', userId: 'u1', name: 'Test', crmStatus: 'contacted' },
  ),
  updateNotes: vi.fn().mockResolvedValue(
    { id: 'p1', userId: 'u1', name: 'Test', notes: 'hello' },
  ),
}));

import { setupAuthEnv } from './helpers/auth';

process.env.BACKEND_SECRET = 'test-secret';
setupAuthEnv();

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';

const SECRET = process.env.BACKEND_SECRET;
const JWT = jwt.sign({ sub: 'u1', email: 'test@test.com' }, process.env.JWT_SECRET!);

function auth(r: request.Test) {
  return r.set('x-internal-secret', SECRET).set('Authorization', `Bearer ${JWT}`);
}

describe('PW-14 -- /api/prospects CRUD', () => {
  it('GET /api/prospects returns user prospects', async () => {
    const res = await auth(request(app).get('/api/prospects'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test');
  });

  it('POST /api/prospects creates a prospect', async () => {
    const res = await auth(request(app).post('/api/prospects').send({
      id: 'p2', name: 'New', address: '2 rue B', type: 'cafe', mapsUrl: 'https://maps.google.com/x',
    }));
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New');
  });

  it('POST /api/prospects rejects missing fields', async () => {
    const res = await auth(request(app).post('/api/prospects').send({ id: 'p3' }));
    expect(res.status).toBe(400);
  });

  it('DELETE /api/prospects/:id removes a prospect', async () => {
    const res = await auth(request(app).delete('/api/prospects/p1'));
    expect(res.status).toBe(204);
  });

  it('PATCH /api/prospects/:id/status updates CRM status', async () => {
    const res = await auth(request(app).patch('/api/prospects/p1/status').send({ status: 'contacted' }));
    expect(res.status).toBe(200);
    expect(res.body.crmStatus).toBe('contacted');
  });

  it('PATCH /api/prospects/:id/status rejects invalid status', async () => {
    const res = await auth(request(app).patch('/api/prospects/p1/status').send({ status: 'invalid' }));
    expect(res.status).toBe(400);
  });

  it('PATCH /api/prospects/:id/notes updates notes', async () => {
    const res = await auth(request(app).patch('/api/prospects/p1/notes').send({ notes: 'hello' }));
    expect(res.status).toBe(200);
    expect(res.body.notes).toBe('hello');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/prospects');
    expect(res.status).toBe(401);
  });
});

describe('PW-14 -- frontend hook no longer depends on localStorage', () => {
  it('useProspects.ts calls /api/prospects instead of localStorage for data', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../frontend/app/hooks/useProspects.ts'),
      'utf-8',
    );
    expect(src).toContain("fetch('/api/prospects")
    expect(src).not.toMatch(/localStorage\.getItem.*setProspects/)
  });
});
