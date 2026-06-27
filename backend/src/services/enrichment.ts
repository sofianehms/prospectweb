export interface EnrichmentResult {
  siret: string | null;
  siren: string | null;
  dirigeant: string | null;
  activite: string | null;
  codeNaf: string | null;
  trancheEffectif: string | null;
  dateCreation: string | null;
  source: 'api-recherche-entreprises';
}

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';

export async function enrichBySiret(siret: string): Promise<EnrichmentResult | null> {
  try {
    const res = await fetch(`${API_URL}?q=${encodeURIComponent(siret)}&per_page=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return parseResult(data);
  } catch {
    return null;
  }
}

export async function enrichByNameAndLocation(
  name: string,
  lat: number,
  lng: number,
): Promise<EnrichmentResult | null> {
  try {
    const res = await fetch(
      `${API_URL}?q=${encodeURIComponent(name)}&lat=${lat}&long=${lng}&per_page=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return parseResult(data);
  } catch {
    return null;
  }
}

function parseResult(data: Record<string, unknown>): EnrichmentResult | null {
  const results = data.results as Array<Record<string, unknown>> | undefined;
  if (!results || results.length === 0) return null;

  const r = results[0];
  const siege = r.siege as Record<string, unknown> | undefined;
  const dirigeants = r.dirigeants as Array<Record<string, unknown>> | undefined;
  const dirigeant = dirigeants?.[0];

  return {
    siret: (siege?.siret as string) ?? null,
    siren: (r.siren as string) ?? null,
    dirigeant: dirigeant
      ? [dirigeant.prenom, dirigeant.nom].filter(Boolean).join(' ') || null
      : null,
    activite: (r.activite_principale as string) ?? (siege?.activite_principale as string) ?? null,
    codeNaf: (r.activite_principale as string) ?? null,
    trancheEffectif: (r.tranche_effectif_salarie as string) ?? null,
    dateCreation: (r.date_creation as string) ?? null,
    source: 'api-recherche-entreprises',
  };
}
