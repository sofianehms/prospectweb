const TIMEOUT_MS    = 6_000;
const MAX_BODY_BYTES = 50_000;
const CURRENT_YEAR  = new Date().getFullYear();
const RECENT_YEARS  = [CURRENT_YEAR, CURRENT_YEAR - 1]; // ex: [2026, 2025]

export interface WebsiteStatus {
  reachable:        boolean;
  statusCode:       number | null;
  hasRecentContent: boolean;
  lastModified:     string | null;
  responseTimeMs:   number;
  error:            string | null;
}

export async function checkWebsite(rawUrl: string): Promise<WebsiteStatus> {
  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal:   controller.signal,
      redirect: 'follow',
      headers:  { 'User-Agent': 'Mozilla/5.0 (compatible; Prospecteur/1.0)' },
    });

    const responseTimeMs = Date.now() - start;
    const lastModified   = res.headers.get('last-modified');
    const html           = await readFirstBytes(res, MAX_BODY_BYTES);
    const hasRecentContent = detectRecentContent(html, lastModified);

    return {
      reachable:  res.status < 500,
      statusCode: res.status,
      hasRecentContent,
      lastModified,
      responseTimeMs,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      reachable:        false,
      statusCode:       null,
      hasRecentContent: false,
      lastModified:     null,
      responseTimeMs:   Date.now() - start,
      error:            controller.signal.aborted ? `Timeout (>${TIMEOUT_MS}ms)` : msg,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Lecture partielle du body (évite de charger des MO inutilement) ──────────
async function readFirstBytes(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(buffer);
}

// ── Détection de contenu récent ───────────────────────────────────────────────
function detectRecentContent(html: string, lastModified: string | null): boolean {
  // 1. Header Last-Modified
  if (isDateRecent(lastModified)) return true;

  // 2. Meta tags (last-modified, article:modified_time, og:updated_time)
  const metaDate = html.match(
    /<meta[^>]+(?:last-modified|modified_time|updated_time)[^>]+content="([^"]+)"/i
  );
  if (metaDate && isDateRecent(metaDate[1])) return true;

  // 3. JSON-LD dateModified / datePublished
  const jsonLdDate = html.match(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/i);
  if (jsonLdDate && isDateRecent(jsonLdDate[1])) return true;

  // 4. <time datetime="2025-... ou 2026-...
  const timeTag = html.match(/<time[^>]+datetime="(\d{4}-\d{2}[^"]*?)"/i);
  if (timeTag && isDateRecent(timeTag[1])) return true;

  // 5. Présence brute des années récentes (copyright, articles, etc.)
  for (const year of RECENT_YEARS) {
    if (html.includes(String(year))) return true;
  }

  return false;
}

function isDateRecent(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return false;
  const ageDays = (Date.now() - date.getTime()) / 86_400_000;
  return ageDays < 730; // moins de 2 ans
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://' + url;
}
