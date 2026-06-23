import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DETAIL_CLIENT_PATH = resolve(
  __dirname,
  '../../../frontend/app/results/[id]/components/DetailClient.tsx',
);

const source = readFileSync(DETAIL_CLIENT_PATH, 'utf-8');

describe('PW-03 — aucune donnée fabriquée dans DetailClient', () => {
  it('ne contient pas d\'horaires codés en dur', () => {
    expect(source).not.toContain('Lun–Sam 7h–20h');
    expect(source).not.toMatch(/Lun.*Sam.*\d+h/);
  });

  it('ne contient pas de fausse mention Instagram', () => {
    expect(source).not.toContain('Instagram');
    expect(source).not.toContain('783 abonnés');
  });

  it('ne contient pas l\'affirmation "Fiche Google Maps complète"', () => {
    expect(source).not.toContain('Fiche Google Maps complète');
  });
});
