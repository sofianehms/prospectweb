import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, extname } from 'path';

const FRONTEND_APP = resolve(__dirname, '../../../frontend/app');

function collectFiles(dir: string, exts: string[]): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, exts));
    } else if (exts.includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

const sourceFiles = collectFiles(FRONTEND_APP, ['.tsx', '.ts']);
const allSource = sourceFiles.map(f => readFileSync(f, 'utf-8')).join('\n');

describe('PW-04 — aucune mention de source fausse dans le frontend', () => {
  it('ne mentionne pas "Pages Jaunes"', () => {
    expect(allSource).not.toMatch(/Pages Jaunes/i);
  });

  it('ne mentionne pas "SIRENE"', () => {
    expect(allSource).not.toMatch(/\bSIRENE\b/);
  });

  it('le pied de page mentionne uniquement les sources réelles', () => {
    const page = readFileSync(resolve(FRONTEND_APP, 'page.tsx'), 'utf-8');
    expect(page).toContain('Google Maps');
    expect(page).toContain('OpenStreetMap');
  });
});
