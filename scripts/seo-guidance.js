'use strict';

/**
 * SEO guidance shared by every post generator.
 *
 * - researchKeywords(): real search phrases from Google Autocomplete (free, no key).
 * - seoBlock(): keyword research + SEO/structure rules, ready to append to a prompt.
 * - generateStructured(): long-form, schema-constrained generation via streaming, so large
 *   posts are never truncated and a cut-off response is never published.
 *
 * Keep the rules in sync with CLAUDE.md "Blog Posts" and POST_KIT in brand-voice.js.
 */

const MODIFIERS = ['', 'how to ', 'why is ', 'what is ', 'best ', ' vs', ' guide', ' examples', ' cost', ' 2026'];

async function suggest(q) {
  try {
    const res = await fetch(
      'https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=' + encodeURIComponent(q),
      { signal: AbortSignal.timeout(8000) }
    );
    const data = JSON.parse(await res.text());
    return Array.isArray(data[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

/**
 * Rank autocomplete suggestions across seed + modifier expansions. A phrase that appears high in
 * many expansions is a phrase many people type. Returns [{ phrase, score }] (best first).
 */
async function researchKeywords(seeds, limit = 20) {
  const score = {};
  for (const seed of seeds.filter(Boolean).slice(0, 4)) {
    for (const m of MODIFIERS) {
      const q = m.startsWith(' ') ? seed + m : m + seed;
      (await suggest(q)).forEach((s, i) => { score[s] = (score[s] || 0) + (10 - i); });
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase, s]) => ({ phrase, score: s }));
}

const SEO_RULES = `SEO, STRUCTURE AND LENGTH RULES (mandatory):
- Choose ONE primary search phrase from the keyword research below (the most popular phrase that honestly matches this post). Pick 3–6 secondary phrases.
- title: primary phrase first, 45–62 characters, specific and benefit- or question-led. It is rendered as the page's only H1 — never put an <h1> in htmlContent.
- Document outline: H2s carry the secondary phrases or the literal questions people search ("Why Is X So Slow?", "X vs Y", "How to …"); H3s are long-tail sub-topics nested under the right H2. Never skip levels, never use headings for styling, no two headings with the same text.
- The primary phrase appears in the first 100 words (the pk-lead answer), in at least one H2, in the metaDescription (140–160 chars) and naturally 3–6 times overall. No keyword stuffing.
- focusKeyword = the primary phrase; secondaryKeywords = the secondary phrases; seoTitle = title; excerpt = metaDescription exactly (the site builds its meta description and social cards from the excerpt).
- Open with a direct 2–3 sentence answer to the searcher's question (pk-lead), then go deep. Serve the reader's real need: what it is, why it matters to them, how it works, what it costs or risks, how to decide, and what to do next.
- AI-answer friendly: short definitions, comparison tables, numbered steps, and self-contained paragraphs that can be quoted on their own.
- Length: as long as the verifiable source material supports — aim for 2,000–3,500 words. Never pad; depth comes from real specifics, comparisons and examples.
- FAQ: 5–8 questions taken from the keyword research's question-style phrases (how/why/what/vs), each answered in 2–4 sentences; the FAQPage schema must use identical text.
- Visuals: never a wall of text — a post kit visual component at least every ~400 words (results band, timing chart, side-by-side, breakdown bar, table, steps, callout).
- Never invent numbers, customers, results or features. If the source has no figures, compare qualitatively.`;

async function seoBlock(seeds) {
  const kw = await researchKeywords(seeds);
  const list = kw.length
    ? kw.map((k, i) => `${i + 1}. ${k.phrase}`).join('\n')
    : '(no autocomplete data — choose the most natural phrase a searcher would type for this topic)';
  return `\n\nKEYWORD RESEARCH (Google Autocomplete, most-typed first, for seeds: ${seeds.filter(Boolean).join(' | ')}):\n${list}\n\n${SEO_RULES}\n`;
}

/**
 * Schema-constrained long-form generation. Streams (required for large max_tokens) and
 * returns the parsed JSON object. Throws instead of returning a truncated post.
 */
async function generateStructured(client, params) {
  const stream = client.messages.stream({ max_tokens: 64000, ...params });
  const message = await stream.finalMessage();
  if (message.stop_reason === 'max_tokens') {
    throw new Error('Post generation hit max_tokens; refusing to publish a truncated post.');
  }
  if (message.stop_reason === 'refusal') {
    throw new Error('Post generation was refused by the model.');
  }
  const text = message.content.find((b) => b.type === 'text');
  if (!text) throw new Error('Post generation returned no text block.');
  return JSON.parse(text.text);
}

module.exports = { researchKeywords, seoBlock, generateStructured, SEO_RULES };
