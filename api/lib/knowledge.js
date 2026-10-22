const DEFAULT_SOURCE_URLS = [
  'https://oman.housing.gov.om/city-details/sultan-haitham-city',
  'https://oman.housing.gov.om/greater-muscat',
  'https://oman.housing.gov.om/onss',
];

const SITE_KNOWLEDGE_DOCUMENT = {
  url: 'internal://sultan-haitham-city-website',
  title: 'Sultan Haitham City website',
  authority: 'website',
  text: `
معلومات الموقع الداخلية المعتمدة:
يوفر موقع مدينة السلطان هيثم خريطة ذكية تفاعلية لاستكشاف الأحياء والمشاريع والمرافق ومواقعها داخل المدينة.
يتضمن الموقع خريطة ثنائية الأبعاد وعرضاً ثلاثي الأبعاد للمدينة.
توجد بوابة للمشاريع والعقارات لاستعراض المشاريع والوحدات وربطها بمواقعها داخل المدينة.
توجد بوابة للخدمات الإلكترونية لبدء الطلبات ومراجعة بيانات المواطن والمستندات ومتابعة المعاملات.
توجد صفحة لتتبع الطلبات باستخدام رقم الطلب، إضافة إلى صفحات تفاصيل الخدمة والبيانات والمستندات ومراجعة الطلب وتأكيده.
يدعم الموقع اللغتين العربية والإنجليزية.

Approved internal website information:
The Sultan Haitham City website provides an interactive smart map for exploring districts, projects, facilities, and their locations in the city.
The website includes a 2D map and a 3D city view.
The Projects and Properties portal presents projects and units and connects them to their city locations.
The Digital Services portal supports starting requests, reviewing citizen details and documents, and following transactions.
Request Tracking uses a request number. The service journey also includes service details, citizen data, documents, review, and confirmation pages.
The website supports Arabic and English.
  `.trim(),
};

// A bundled snapshot keeps the assistant useful when the Ministry website is
// temporarily slow or unavailable. Live Ministry pages are still fetched on
// every cold cache cycle and take precedence when they can be reached.
const MINISTRY_SNAPSHOT_DOCUMENT = {
  url: 'internal://mohup-sultan-haitham-city-snapshot',
  title: 'Ministry of Housing and Urban Planning — Sultan Haitham City',
  authority: 'ministry',
  text: `
حقائق رسمية معتمدة عن مدينة السلطان هيثم:
تقع مدينة السلطان هيثم غرب مسقط، وهي مدينة من الجيل الجديد ضمن المخطط الهيكلي لمسقط الكبرى.
تبلغ المساحة الإجمالية للمدينة 14.8 كيلومتر مربع.
يضم المخطط 20,000 وحدة سكنية ويستهدف 100,000 نسمة.
تبلغ المساحة الخضراء الإجمالية 2,900,000 متر مربع، ويضم المخطط 18 حيًا.
تبلغ القيمة الإجمالية للمشروع 5.2 مليار دولار أمريكي.
أعمال التهيئة للمرحلة الأولى مكتملة بنسبة 100%، وتوجد عدة أحياء قيد الإنشاء، وقد بيعت المراحل السكنية المبكرة بالكامل.
من المتوقع استقبال أول السكان خلال 2026–2027، ويستمر تنفيذ المدينة بالكامل على مراحل حتى 2045.
المخطط من تصميم SOM، ويعتمد أحياء قابلة للمشي وبنية أساسية مرنة وتخطيطًا يتمحور حول الإنسان.
تتوزع المدارس والرعاية الصحية والجامعات والمؤسسات الثقافية والمساجد والخدمات المدنية بحيث تكون الاحتياجات اليومية قريبة من السكان.
تشمل البنية الذكية والمستدامة الطاقة المتجددة وتبريد المناطق والتنقل الذكي وإدارة المدينة المعتمدة على البيانات.

Verified official facts about Sultan Haitham City:
Sultan Haitham City is a new-generation city west of Muscat under the Greater Muscat Structure Plan.
Its total area is 14.8 km². The master plan includes 20,000 residential units for 100,000 residents, 2,900,000 m² of green area, and 18 neighbourhoods.
The total project value is USD 5.2 billion.
Phase 1 enabling works are 100% complete, multiple neighbourhoods are under active construction, and early residential phases are sold out.
The first residents are expected in 2026–2027, with full city delivery planned in phases through 2045.
The master plan is by SOM and focuses on walkable neighbourhoods, resilient infrastructure, and human-centred planning.
Schools, healthcare, universities, cultural institutions, mosques, and civic services are distributed across the city.
Smart and sustainable infrastructure includes renewable energy, district cooling, smart mobility, and data-enabled city management.
  `.trim(),
};

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
  const timeout = setTimeout(() => controller.abort(), 3_500);
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
      authority: 'ministry',
      text: contentType.includes('html') ? htmlToText(raw) : raw.replace(/\s+/g, ' ').trim(),
    };
    cache.set(url.href, { fetchedAt: Date.now(), value });
    return value;
  } catch (error) {
    // Prefer a previously verified response over failing the whole chat request.
    if (cached?.value) return cached.value;
    throw error;
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
  const ministryDocuments = settled.filter((result) => result.status === 'fulfilled').map((result) => result.value);

  const documents = [MINISTRY_SNAPSHOT_DOCUMENT, SITE_KNOWLEDGE_DOCUMENT, ...ministryDocuments];
  const selected = rankChunks(documents.flatMap((document) => chunkDocument(document)), question);
  const context = selected.map((chunk, index) => (
    `[SOURCE ${index + 1}]\nAuthority: ${chunk.authority === 'ministry' ? 'Official Ministry of Housing and Urban Planning' : 'Sultan Haitham City website'}\nTitle: ${chunk.title}\nContent:\n${chunk.text}`
  )).join('\n\n');
  return { context };
}

export const __testables = { htmlToText, normalize, chunkDocument, rankChunks, assertSafeSource, retrieveKnowledge };
