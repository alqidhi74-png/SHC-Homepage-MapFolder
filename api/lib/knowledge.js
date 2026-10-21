const DEFAULT_SOURCE_URLS = [
  'https://oman.housing.gov.om/city-details/sultan-haitham-city',
  'https://oman.housing.gov.om/greater-muscat',
  'https://oman.housing.gov.om/onss',
];

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_SOURCE_BYTES = 750_000;
const cache = new Map();

function configuredSources() {
  const raw = process.env.SHC_KNOWLEDGE_URLS || DEFAULT_SOURCE_URLS.join('\n');
  return [...new Set(raw.split(/[\n,]/).map((value) => value.trim()).filter(Boolean))].slice(0, 8);
}

function allowedHosts() {
  const configured = process.env.SHC_ALLOWED_SOURCE_HOSTS || 'housing.gov.om,oman.housing.gov.om';
  return configured.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
}

function assertSafeSource(source) {
  const url = new URL(source);
  if (url.protocol !== 'https:') throw new Error('Knowledge sources must use HTTPS.');
  const hostname = url.hostname.toLowerCase();
  const allowed = allowedHosts().some((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (!allowed) throw new Error(`Knowledge source host is not allowed: ${hostname}`);
  return url;
}

function decodeEntities(value) {
  const entities = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    '#39': "'", '#x27': "'", '#x2F': '/',
  };
  return value.replace(/&([^;]+);/g, (match, entity) => {
    if (entities[entity]) return entities[entity];
    if (/^#\d+$/.test(entity)) return String.fromCodePoint(Number(entity.slice(1)));
    if (/^#x[\da-f]+$/i.test(entity)) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    return match;
  });
}

function htmlToText(html) {
  return decodeEntities(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function documentTitle(html, fallback) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToText(match[1]).slice(0, 160) : fallback;
}

async function fetchSource(source) {
  const url = assertSafeSource(source);
  const cached = cache.get(url.href);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SHC-City-Assistant/1.0', Accept: 'text/html,text/plain,application/json' },
    });
    if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_SOURCE_BYTES) throw new Error('Knowledge source is too large.');
    if (!/(text\/html|text\/plain|application\/json)/i.test(contentType)) {
      throw new Error(`Unsupported source format: ${contentType || 'unknown'}`);
    }
    const raw = (await response.text()).slice(0, MAX_SOURCE_BYTES);
    const value = {
      url: url.href,
      title: contentType.includes('html') ? documentTitle(raw, url.hostname) : url.hostname,
      text: contentType.includes('html') ? htmlToText(raw) : raw.replace(/\s+/g, ' ').trim(),
    };
    cache.set(url.href, { fetchedAt: Date.now(), value });
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return [...new Set(normalize(value).split(' ').filter((token) => token.length > 2))];
}

function chunkDocument(document, size = 1400, overlap = 180) {
  const paragraphs = document.text.split(/\n+/).map((value) => value.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 1 > size) {
      chunks.push({ ...document, text: current });
      current = `${current.slice(-overlap)}\n${paragraph}`;
    } else {
      current = current ? `${current}\n${paragraph}` : paragraph;
    }
  }
  if (current) chunks.push({ ...document, text: current });
  return chunks;
}

function rankChunks(chunks, question) {
  const queryTokens = tokens(question);
  return chunks
    .map((chunk, index) => {
      const haystack = normalize(chunk.text);
      const score = queryTokens.reduce((total, token) => total + (haystack.includes(token) ? 2 : 0), 0)
        + (index === 0 ? 0.25 : 0);
      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export async function retrieveKnowledge(question) {
  const settled = await Promise.allSettled(configuredSources().map(fetchSource));
  const documents = settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);
  if (!documents.length) {
    const reason = settled.find((result) => result.status === 'rejected')?.reason;
    throw new Error(reason?.message || 'No knowledge source could be loaded.');
  }

  const selected = rankChunks(documents.flatMap((document) => chunkDocument(document)), question);
  const context = selected.map((chunk, index) => (
    `[SOURCE ${index + 1}]\nTitle: ${chunk.title}\nURL: ${chunk.url}\nContent:\n${chunk.text}`
  )).join('\n\n');
  const sources = [...new Map(selected.map((chunk) => [chunk.url, { title: chunk.title, url: chunk.url }])).values()];
  return { context, sources };
}

export const __testables = { htmlToText, normalize, chunkDocument, rankChunks, assertSafeSource };
