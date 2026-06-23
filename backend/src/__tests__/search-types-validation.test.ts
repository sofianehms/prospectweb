import { describe, it, expect } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';

import { app } from '../index';

const SECRET = 'test-secret';
const BASE = '/api/search';
const VALID_PARAMS = 'lat=48.85&lng=2.35&radius=1000';

describe('PW-01 — validation du paramètre types', () => {
  it('rejette un type hors liste blanche avec 400', async () => {
    const res = await request(app)
      .get(`${BASE}?${VALID_PARAMS}&types=fake_type`)
      .set('x-internal-secret', SECRET);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Types invalides');
    expect(res.body.error).toContain('fake_type');
    expect(res.body.error).toContain('Types autorisés');
  });

  it('rejette un mélange de types valides et invalides', async () => {
    const res = await request(app)
      .get(`${BASE}?${VALID_PARAMS}&types=restaurant,bogus_type,cafe`)
      .set('x-internal-secret', SECRET);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('bogus_type');
    // Only invalid types appear before "Types autorisés"
    const beforeAllowed = res.body.error.split('Types autorisés')[0];
    expect(beforeAllowed).not.toContain('restaurant');
  });

  it('rejette plus de 8 types avec 400', async () => {
    const types = [
      'restaurant', 'cafe', 'bar', 'bakery',
      'hair_salon', 'beauty_salon', 'clothing_store', 'pharmacy', 'florist',
    ].join(',');

    const res = await request(app)
      .get(`${BASE}?${VALID_PARAMS}&types=${types}`)
      .set('x-internal-secret', SECRET);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Trop de types');
    expect(res.body.error).toContain('Maximum autorisé : 8');
  });

  it('ne rejette pas des types valides en nombre autorisé', async () => {
    const res = await request(app)
      .get(`${BASE}?${VALID_PARAMS}&types=restaurant,cafe`)
      .set('x-internal-secret', SECRET);

    // Not a validation error — any non-400 means validation passed
    expect(res.status).not.toBe(400);
  }, 15000);

  it('ne rejette pas exactement 8 types (limite)', async () => {
    const types = [
      'restaurant', 'cafe', 'bar', 'bakery',
      'hair_salon', 'beauty_salon', 'clothing_store', 'pharmacy',
    ].join(',');

    const res = await request(app)
      .get(`${BASE}?${VALID_PARAMS}&types=${types}`)
      .set('x-internal-secret', SECRET);

    expect(res.status).not.toBe(400);
  }, 60000);
});
