import { lookup } from 'dns/promises';

const TIMEOUT_MS      = 6_000;
const MAX_BODY_BYTES  = 50_000;
const MAX_REDIRECTS   = 3;
export const MAX_CONCURRENT = Number(process.env.WEBSITE_CHECK_CONCURRENCY) || 5;

let running = 0;
const queue: Array<{ resolve: () => void }> = [];

async function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  await new Promise<void>(resolve => queue.push({ resolve }));
}

function releaseSlot(): void {
  const next = queue.shift();
  if (next) {
    next.resolve();
  } else {
    running--;
  }
}
const CURRENT_YEAR    = new Date().getFullYear();
const RECENT_YEARS    = [CURRENT_YEAR, CURRENT_YEAR - 1];

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

const PRIVATE_RANGES: Array<{ prefix: number[]; bits: number }> = [
  { prefix: [10],              bits: 8  },
  { prefix: [172, 16],         bits: 12 },
  { prefix: [192, 168],        bits: 16 },
  { prefix: [127],             bits: 8  },
  { prefix: [169, 254],        bits: 16 },
  { prefix: [0],               bits: 8  },
];

export function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip === '::' || ip.startsWith('::ffff:127.')) return true;
  if (ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd')) return true;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  for (const range of PRIVATE_RANGES) {
    const prefixOctets = range.prefix;
    const matchBits = range.bits;
    const fullBytes = Math.floor(matchBits / 8);
    const remainBits = matchBits % 8;

    let match = true;
    for (let i = 0; i < fullBytes; i++) {
      if (parts[i] !== prefixOctets[i]) { match = false; break; }
    }
    if (match && remainBits > 0) {
      const mask = (0xFF << (8 - remainBits)) & 0xFF;
      if ((parts[fullBytes] & mask) !== (prefixOctets[fullBytes] & mask)) match = false;
    }
    if (match) return true;
  }

  return false;
}

async function assertPublicHost(url: string): Promise<void> {
  const hostname = new URL(url).hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (isPrivateIp(hostname)) throw new SsrfError(`Adresse IP privée bloquée : ${hostname}`);
    return;
  }
  const { address } = await lookup(hostname);
  if (isPrivateIp(address)) {
    throw new SsrfError(`Le domaine ${hostname} résout vers une IP privée (${address})`);
  }
}

export interface WebsiteStatus {
  reachable:        boolean;
  statusCode:       number | null;
  hasRecentContent: boolean;
  lastModified:     string | null;
  responseTimeMs:   number;
  error:            string | null;
}

export async function checkWebsite(rawUrl: string): Promise<WebsiteStatus> {
  await acquireSlot();
  let url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    await assertPublicHost(url);

    let res: Response | null = null;
    let redirectCount = 0;

    while (redirectCount <= MAX_REDIRECTS) {
      res = await fetch(url, {
        signal:   controller.signal,
        redirect: 'manual',
        headers:  { 'User-Agent': 'Mozilla/5.0 (compatible; Prospecteur/1.0)' },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;
        url = new URL(location, url).href;
        await assertPublicHost(url);
        redirectCount++;
        continue;
      }
      break;
    }

    if (!res) {
      return errorResult(start, 'Pas de réponse');
    }

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
    if (err instanceof SsrfError) {
      console.warn(`[website-checker] SSRF bloqué: ${err.message}`);
      return errorResult(start, 'URL bloquée (adresse privée)');
    }
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
    releaseSlot();
  }
}

function errorResult(start: number, error: string): WebsiteStatus {
  return {
    reachable: false,
    statusCode: null,
    hasRecentContent: false,
    lastModified: null,
    responseTimeMs: Date.now() - start,
    error,
  };
}

async function readFirstBytes(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return '';
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
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

function detectRecentContent(html: string, lastModified: string | null): boolean {
  if (isDateRecent(lastModified)) return true;

  const metaDate = html.match(
    /<meta[^>]+(?:last-modified|modified_time|updated_time)[^>]+content="([^"]+)"/i
  );
  if (metaDate && isDateRecent(metaDate[1])) return true;

  const jsonLdDate = html.match(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/i);
  if (jsonLdDate && isDateRecent(jsonLdDate[1])) return true;

  const timeTag = html.match(/<time[^>]+datetime="(\d{4}-\d{2}[^"]*?)"/i);
  if (timeTag && isDateRecent(timeTag[1])) return true;

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
  return ageDays < 730;
}

function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return 'https://' + url;
}
