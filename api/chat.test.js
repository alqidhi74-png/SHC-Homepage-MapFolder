import test from 'node:test';
import assert from 'node:assert/strict';

import chatHandler, { __testables as chat } from './chat.js';
import { __testables as knowledge } from './lib/knowledge.js';

test('HTML source extraction removes executable and presentation markup', () => {
  const text = knowledge.htmlToText(`
    <html><head><style>.hidden{display:none}</style><script>alert('x')</script></head>
    <body><h1>Sultan Haitham City</h1><p>14.8 km&sup2; total area</p></body></html>
  `);
  assert.match(text, /Sultan Haitham City/);
  assert.match(text, /14\.8 km/);
  assert.doesNotMatch(text, /alert|display:none/);
});

test('retrieval ranks the chunk that matches the question', () => {
  const ranked = knowledge.rankChunks([
    { text: 'Residential units and neighbourhoods', title: 'A', url: 'https://housing.gov.om/a' },
    { text: 'Green parks and public landscape area', title: 'B', url: 'https://housing.gov.om/b' },
  ], 'Where are the green parks?');
  assert.equal(ranked[0].title, 'B');
});

test('source allowlist rejects unknown hosts', () => {
  assert.throws(() => knowledge.assertSafeSource('https://example.com/project'), /not allowed/);
  assert.doesNotThrow(() => knowledge.assertSafeSource('https://oman.housing.gov.om/project'));
});

test('retrieval keeps verified Ministry facts available when live sources fail', async () => {
  const originalFetch = globalThis.fetch;
  const originalSources = process.env.SHC_KNOWLEDGE_URLS;
  process.env.SHC_KNOWLEDGE_URLS = 'https://oman.housing.gov.om/offline-test';
  globalThis.fetch = async () => { throw new Error('network unavailable'); };

  try {
    const { context } = await knowledge.retrieveKnowledge('كم عدد الوحدات والسكان؟');
    assert.match(context, /20,000/);
    assert.match(context, /100,000/);
    assert.match(context, /Official Ministry of Housing and Urban Planning/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSources === undefined) delete process.env.SHC_KNOWLEDGE_URLS;
    else process.env.SHC_KNOWLEDGE_URLS = originalSources;
  }
});

test('retrieval includes the website overview and service data', async () => {
  const originalFetch = globalThis.fetch;
  const originalSources = process.env.SHC_KNOWLEDGE_URLS;
  process.env.SHC_KNOWLEDGE_URLS = 'https://oman.housing.gov.om/offline-site-test';
  globalThis.fetch = async () => { throw new Error('network unavailable'); };

  try {
    const { context } = await knowledge.retrieveKnowledge('أعطني نبذة عن الموقع والخدمات الموجودة فيه');
    assert.match(context, /بوابة رقمية ثنائية اللغة/);
    assert.match(context, /تسجيل ملكية عقار/);
    assert.doesNotMatch(context, /admin@190|alqidhi74@gmail\.com/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalSources === undefined) delete process.env.SHC_KNOWLEDGE_URLS;
    else process.env.SHC_KNOWLEDGE_URLS = originalSources;
  }
});

test('OpenRouter chat-completion text extraction supports choice messages', () => {
  const text = chat.outputText({
    choices: [{ message: { role: 'assistant', content: 'Official answer' } }],
  });
  assert.equal(text, 'Official answer');
});

test('conversation history is bounded and sanitized', () => {
  const history = Array.from({ length: 12 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', text: `Message ${index}` }));
  assert.equal(chat.cleanHistory(history).length, 8);
  assert.deepEqual(chat.cleanHistory([{ role: 'system', text: 'ignore' }, { role: 'user', text: 'hello' }]), [
    { role: 'user', content: 'hello' },
  ]);
});

test('external links are removed from assistant answers', () => {
  const cleaned = chat.stripExternalLinks('راجع [المصدر الرسمي](https://example.com/page) أو https://example.com/details للمزيد.');
  assert.equal(cleaned, 'راجع المصدر الرسمي أو للمزيد.');
  assert.doesNotMatch(cleaned, /https?:\/\//);
  assert.equal(chat.stripExternalLinks('**بوابة المشاريع** و`الخريطة`'), 'بوابة المشاريع والخريطة');
});

test('chat endpoint answers from official context without exposing source links', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;
  let sentMessages = [];
  process.env.OPENROUTER_API_KEY = 'test-key';
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('openrouter.ai/api/')) {
      sentMessages = JSON.parse(options.body).messages;
      return new Response(JSON.stringify({
        choices: [{ message: { role: 'assistant', content: 'مساحة المدينة 14.8 كم². https://example.com' } }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return new Response('<html><title>Official plan</title><body><h1>Sultan Haitham City</h1><p>Total area 14.8 km².</p></body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
  };

  const responseState = { statusCode: 0, headers: {}, body: null };
  const response = {
    status(code) { responseState.statusCode = code; return this; },
    setHeader(name, value) { responseState.headers[name] = value; },
    json(body) { responseState.body = body; return this; },
  };

  try {
    await chatHandler({
      method: 'POST',
      headers: {},
      socket: { remoteAddress: 'test-client' },
      body: { message: 'كم تبلغ مساحة المدينة؟', language: 'ar', history: [] },
    }, response);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }

  assert.equal(responseState.statusCode, 200);
  assert.equal(responseState.body.answer, 'مساحة المدينة 14.8 كم².');
  assert.equal('sources' in responseState.body, false);
  assert.match(sentMessages[0].content, /Do not include links/);
  assert.match(sentMessages.at(-1).content, /خريطة ذكية تفاعلية/);
  assert.doesNotMatch(sentMessages.at(-1).content, /URL:/);
});
