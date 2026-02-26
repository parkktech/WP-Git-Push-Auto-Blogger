'use strict';
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');
let failures = 0;

function assert(condition, msg) {
  if (!condition) { console.error('FAIL:', msg); failures++; }
  else { console.log('PASS:', msg); }
}

// SC1: BRAND identity object
assert(BRAND.name === 'Parkk Technology', 'BRAND.name is Parkk Technology');
assert(typeof BRAND.author === 'string' && BRAND.author.length > 0, 'BRAND.author is non-empty string');
assert(Array.isArray(BRAND.voiceRules) && BRAND.voiceRules.length >= 3, 'BRAND.voiceRules has voice guidelines');
assert(Array.isArray(BRAND.services) && BRAND.services.length >= 3, 'BRAND.services has service descriptions');
assert(BRAND.services.every(s => s.name && s.tagline), 'Each service has name and tagline');

// SC2: 6 different urgency blocks on successive calls
const urgencySet = new Set();
for (let i = 0; i < 6; i++) urgencySet.add(JSON.stringify(getUrgencyBlock()));
assert(urgencySet.size === 6, 'getUrgencyBlock() returns 6 distinct values on 6 successive calls');

// SC3: FAQs framed for hire-ai-developer intent
const faqs = getRandomFAQs();
assert(faqs.length === 9, 'getRandomFAQs() returns 9 templates');
const hireIntentFaqs = faqs.filter(f => f.searchIntent === 'hire-ai-developer');
assert(hireIntentFaqs.length >= 3, 'At least 3 FAQs target hire-ai-developer intent');
assert(faqs.every(f => f.question && f.answerScaffold), 'All FAQs have question and answerScaffold');

// SC4: CTA with contact URL, no prohibited phrase
const cta = getRandomCTA();
assert(cta.url.includes('parkktech.com/contact'), 'CTA includes parkktech.com/contact URL');
assert(typeof cta.action === 'string' && cta.action.length > 0, 'CTA has action verb text');
const allContent = JSON.stringify({ BRAND, urgency: Array.from({length: 6}, () => getUrgencyBlock()), faqs: getRandomFAQs(), cta: getRandomCTA() });
assert(!allContent.includes('AI writes our code'), 'No content contains prohibited phrase "AI writes our code"');

// SC5: Dependencies installed
try { require('@anthropic-ai/sdk'); assert(true, '@anthropic-ai/sdk installed'); } catch { assert(false, '@anthropic-ai/sdk installed'); }
try { require('puppeteer'); assert(true, 'puppeteer installed'); } catch { assert(false, 'puppeteer installed'); }
try { require('form-data'); assert(true, 'form-data installed'); } catch { assert(false, 'form-data installed'); }

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' FAILURE(S)'}`);
process.exit(failures > 0 ? 1 : 0);
