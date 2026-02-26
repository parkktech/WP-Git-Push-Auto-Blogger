'use strict';

const { Anthropic } = require('@anthropic-ai/sdk');
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');
const { POST_JSON_SCHEMA } = require('./evaluate-commit');
const { searchUnsplash } = require('./media-pipeline');
const { uploadMedia, createWordPressPost } = require('./wp-client');

// ─── Anthropic Client (module-level singleton) ──────────────────────────────

const client = new Anthropic();

// ─── Content Pillars ──────────────────────────────────────────────────────────

const PILLARS = [
  {
    name: 'Why Hire an AI Dev Company',
    angles: [
      'Healthcare industry — patient data processing and compliance automation',
      'Finance industry — fraud detection and transaction intelligence',
      'E-commerce — personalization engines and inventory prediction',
      'Cost savings and ROI over in-house AI team build-out',
      'Speed to market — weeks vs 18-month in-house ramp',
    ],
  },
  {
    name: 'AI Integration for Existing Businesses',
    angles: [
      'Automating repetitive back-office workflows without replacing core systems',
      'Adding AI to customer-facing products (chatbots, recommendations)',
      'Data pipeline modernization — structured and unstructured data',
      'Competitive advantage — integration-first before greenfield replacement',
      'E-commerce personalization and upsell intelligence',
    ],
  },
  {
    name: 'Building AI Products from Scratch',
    angles: [
      'The full product build — from architecture to launch',
      'Healthcare diagnostics and clinical decision support products',
      'Finance: AI-native lending, underwriting, and risk platforms',
      'Equity partnership model — we build for equity, no cash down',
      'Speed advantages of AI-augmented development pipelines',
    ],
  },
  {
    name: 'Industry-Specific AI Solutions',
    angles: [
      'Healthcare: HIPAA-compliant AI workflows and document processing',
      'Finance: Real-time fraud detection and compliance reporting',
      'E-commerce: Demand forecasting and dynamic pricing',
      'Professional services: Contract analysis and knowledge management',
      'Logistics: Route optimization and predictive maintenance',
    ],
  },
  {
    name: 'Our Approach & Case Studies',
    angles: [
      'How we scope projects before committing — no surprises after kickoff',
      'Portfolio showcase: what we built and the measurable outcomes',
      'The equity partnership model explained for serious founders',
      'Why we publish every commit — our portfolio is our build log',
      'How AI-augmented development compresses timelines without cutting corners',
    ],
  },
];

// ─── Deterministic Pillar/Angle Selection ─────────────────────────────────────

/**
 * Returns the ISO 8601 week number for a given Date.
 * ISO weeks start on Monday; week 1 contains January 4th.
 * Source: https://weeknumber.com/how-to/javascript
 *
 * @param {Date} date - Date to compute week number for
 * @returns {number} ISO 8601 week number (1-53)
 */
function getISOWeekNumber(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Selects pillar and angle deterministically from ISO week number.
 *
 * pillarIndex = weekNumber % 5  (cycles 0-4 across weeks)
 * angleIndex  = Math.floor(weekNumber / 5) % 5  (shifts angle every 5 weeks)
 *
 * Result: the same week number always picks the same pillar/angle pair.
 * A 25-week cycle covers all 25 unique pillar+angle combinations.
 *
 * @param {Date} [date] - Date to compute week for. Defaults to today.
 * @returns {{ pillar: object, angle: string, weekNumber: number, pillarIndex: number, angleIndex: number }}
 */
function selectPillarAndAngle(date = new Date()) {
  const weekNumber = getISOWeekNumber(date);
  const pillarIndex = weekNumber % 5;
  const angleIndex = Math.floor(weekNumber / 5) % 5;
  const pillar = PILLARS[pillarIndex];
  const angle = pillar.angles[angleIndex];
  return { pillar, angle, weekNumber, pillarIndex, angleIndex };
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Builds the system prompt for thought leadership post generation.
 *
 * Mirrors buildSystemPrompt() from evaluate-commit.js but pillar/angle-driven
 * rather than commit-driven. No portfolio framing — this is strategic thought
 * leadership that naturally weaves in Parkk's capabilities.
 *
 * @param {object} brand - BRAND object from brand-voice.js
 * @param {object} pillar - Pillar object with name and angles
 * @param {string} angle - The selected angle string
 * @param {object} urgencyBlock - Urgency block with angle and text
 * @param {Array} faqs - FAQ template objects with question, answerScaffold, searchIntent
 * @param {object} cta - CTA block with heading, body, url, action
 * @returns {string} The complete system prompt
 */
function buildThoughtLeadershipPrompt(brand, pillar, angle, urgencyBlock, faqs, cta) {
  const voiceRulesText = brand.voiceRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n');

  const faqTemplatesText = faqs
    .map(
      (faq) =>
        `- Q: ${faq.question}\n  Direction: ${faq.answerScaffold}`
    )
    .join('\n');

  const today = new Date().toISOString().split('T')[0];

  return `You are a thought leadership writer for ${brand.name}, a software development and AI integration company.
Author: ${brand.author}
Author title: ${brand.authorTitle}

TOPIC: "${pillar.name}"
ANGLE: "${angle}"

VOICE RULES — follow these strictly:
${voiceRulesText}

CONTENT STRUCTURE:
- Target 1500-2500 words
- Write from the perspective of an expert practitioner, not a marketer
- No code snippets — business outcomes and strategic insight only
- Keyword-rich H2 and H3 headings optimized for search queries related to the topic
- This is a thought leadership article, not a portfolio piece — but naturally weave in Parkk Technology's capabilities
- Write in a confident, direct builder tone that demonstrates domain expertise

ANSWER-FIRST BLOCK:
Generate an "answerFirstBlock" field containing exactly 40-60 words that directly answers the core question implied by the topic and angle. Optimized for AI Overview snippets — it should be a standalone, self-contained answer that makes sense without reading the full post.

FAQ SECTION:
Generate 3-5 FAQ items (faqItems array). Use the following FAQ templates as inspiration — adapt the questions and answers to be specifically relevant to the topic and angle:
${faqTemplatesText}
Do NOT copy the templates verbatim. Adapt each question to relate to the specific topic and angle while maintaining the same search intent categories.

URGENCY BLOCK (weave into the body naturally — do NOT make it a standalone section):
"${urgencyBlock.text}"

CTA BLOCK:
End the post with a call-to-action section:
- Heading: ${cta.heading}
- Body: ${cta.body}
- Link URL: ${cta.url}
- Button/link text: ${cta.action}
Format this as an HTML section with appropriate heading and a styled link.

SCHEMA GENERATION:
1. blogPostingSchema: Generate a complete BlogPosting JSON-LD as a string containing a <script type="application/ld+json"> tag. Include:
   - @context: https://schema.org
   - @type: BlogPosting
   - headline: the post title
   - author: { @type: Person, name: "${brand.author}" }
   - publisher: { @type: Organization, name: "${brand.name}" }
   - datePublished: ${today}
   - keywords: array of relevant keywords

2. faqPageSchema: Generate a complete FAQPage JSON-LD as a string containing a <script type="application/ld+json"> tag. Include:
   - @context: https://schema.org
   - @type: FAQPage
   - mainEntity: array of Question objects, each with name (question text) and acceptedAnswer (Answer with text)
   Use the same FAQ items from the faqItems array.

CATEGORIES AND TAGS:
- Generate 2-3 category slugs (e.g., "ai-strategy", "thought-leadership", "business-ai")
- Generate 3-5 tag strings relevant to the post topic and angle

OUTPUT FORMAT:
Return a JSON object matching the provided schema exactly. The htmlContent field should contain the full post HTML (all sections, headings, paragraphs, CTA). The blogPostingSchema and faqPageSchema fields should each be complete <script type="application/ld+json"> tag strings.`;
}

// ─── Thought Leadership Generation ───────────────────────────────────────────

/**
 * Generates a complete thought leadership post from a pillar/angle selection.
 *
 * Mirrors generateBlogPost() from evaluate-commit.js but without commit context.
 * Uses the same structured output pattern (POST_JSON_SCHEMA) for WordPress
 * compatibility.
 *
 * @param {object} pillar - Pillar object with name and angles
 * @param {string} angle - The selected angle string
 * @param {number} weekNumber - ISO week number (for logging)
 * @returns {Promise<object>} Complete post JSON matching POST_JSON_SCHEMA
 */
async function generateThoughtLeadership(pillar, angle, weekNumber) {
  const urgencyBlock = getUrgencyBlock();
  const faqs = getRandomFAQs(3);
  const cta = getRandomCTA();

  const systemPrompt = buildThoughtLeadershipPrompt(BRAND, pillar, angle, urgencyBlock, faqs, cta);

  const today = new Date().toISOString().split('T')[0];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a thought leadership article on the following topic and angle.

TOPIC: "${pillar.name}"
ANGLE: "${angle}"
ISO WEEK: ${weekNumber}
Today's date (ISO): ${today}

This is NOT a commit-based post — do not reference any specific code changes or commits. Write a strategic, insight-driven article that demonstrates Parkk Technology's expertise in the topic area and naturally positions us as the right partner for businesses facing this challenge.`,
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: POST_JSON_SCHEMA,
      },
    },
  });

  const post = JSON.parse(response.content[0].text);

  // Post-process: inject JSON-LD schema tags into htmlContent if not already present
  // (same pattern as evaluate-commit.js generateBlogPost)
  if (post.blogPostingSchema && !post.htmlContent.includes('BlogPosting')) {
    post.htmlContent += '\n' + post.blogPostingSchema;
  }

  if (post.faqPageSchema && !post.htmlContent.includes('FAQPage')) {
    post.htmlContent += '\n' + post.faqPageSchema;
  }

  return post;
}

// ─── Telegram Notification ────────────────────────────────────────────────────

/**
 * Sends a Telegram notification about a newly created thought leadership draft.
 *
 * - Non-fatal: entire function is wrapped in try/catch. Telegram failure
 *   NEVER causes the pipeline to exit with an error.
 * - Graceful skip: if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing,
 *   logs and returns without error.
 * - Uses native fetch() to Telegram Bot API (no library).
 * - HTML parse mode with proper escaping for user-generated text.
 * - Called on SUCCESS only — per CONTEXT.md silent fail decision,
 *   Telegram notifications are NOT sent on failure.
 *
 * @param {string} postUrl - WordPress draft URL
 * @param {string} postTitle - Blog post title (user-generated, needs escaping)
 * @param {string} pillarName - Content pillar name
 * @param {string} angle - Selected angle
 * @param {number} weekNumber - ISO week number
 */
async function sendTelegramNotification(postUrl, postTitle, pillarName, angle, weekNumber) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('Telegram not configured — skipping notification');
    return;
  }

  // Escape HTML special characters in user-generated text
  const safeTitle = postTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const safePillar = pillarName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const message = [
    '<b>New thought leadership draft created</b>',
    '',
    `<b>Title:</b> ${safeTitle}`,
    `<b>Pillar:</b> ${safePillar}`,
    `<b>Week:</b> ISO Week ${weekNumber}`,
    `<b>Status:</b> Draft`,
    '',
    `<a href="${postUrl}">View draft in WordPress</a>`,
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      console.error(`Telegram notification failed: ${response.status} ${await response.text()}`);
    } else {
      console.log('Telegram notification sent');
    }
  } catch (err) {
    // Non-fatal — pipeline already succeeded at this point
    console.error('Telegram notification error (non-fatal):', err.message);
  }
}

// ─── Main Pipeline Orchestrator ───────────────────────────────────────────────

async function main() {
  // Step 1 — Select pillar and angle deterministically by ISO week number
  const { pillar, angle, weekNumber, pillarIndex, angleIndex } = selectPillarAndAngle();

  // Step 2 — Log selected pillar, angle, and week number
  console.log(`ISO Week: ${weekNumber}`);
  console.log(`Pillar [${pillarIndex}]: ${pillar.name}`);
  console.log(`Angle [${angleIndex}]: ${angle}`);

  // Step 3 — Acquire stock images via Unsplash (pillar name as search query)
  const stockImages = await searchUnsplash(pillar.name, 3);
  console.log(`Stock images found: ${stockImages.length}`);

  // Step 4 — Generate thought leadership post via Claude
  const post = await generateThoughtLeadership(pillar, angle, weekNumber);
  console.log(`Post generated: "${post.title}"`);

  // Step 5 — Append Unsplash attribution to post content
  // (same pattern as generate-blog-post.js Step 5)
  if (stockImages.length > 0) {
    const attributionBlock = stockImages
      .map(img => `<p class="photo-credit">${img.attribution}</p>`)
      .join('\n');
    post.htmlContent += `\n\n<!-- Unsplash Attribution -->\n${attributionBlock}`;
  }

  // Step 6 — Upload media to WordPress
  // (thought leadership has no screenshots — stock images only)
  const allImages = stockImages.map(s => ({
    buffer: s.buffer,
    filename: s.filename,
    mimeType: s.mimeType,
  }));

  const mediaIds = [];
  for (const img of allImages) {
    try {
      const media = await uploadMedia(img.buffer, img.filename, img.mimeType);
      mediaIds.push(media.id);
      console.log(`Uploaded media: ${img.filename} -> ID ${media.id}`);
    } catch (err) {
      console.warn(`Media upload failed for ${img.filename}: ${err.message}`);
    }
  }

  // Step 7 — Create WordPress post as draft (PUBLISH_STATUS defaults to 'draft' in wp-client.js)
  const wpPost = await createWordPressPost(post, mediaIds);
  console.log(`Post created: ${wpPost.link}`);

  // Step 8 — Send Telegram notification (success only — silent fail per CONTEXT.md)
  await sendTelegramNotification(wpPost.link, post.title, pillar.name, angle, weekNumber);

  // Step 9 — Output JSON summary to stdout
  console.log(JSON.stringify({
    postId: wpPost.id,
    postUrl: wpPost.link,
    pillarIndex,
    angleIndex,
    weekNumber,
    pillarName: pillar.name,
    angle,
    title: post.title,
    status: wpPost.status,
  }));
}

// ─── Entry Point and Exports ─────────────────────────────────────────────────

main().catch(err => {
  console.error('Thought leadership pipeline failed:', err.message);
  process.exit(1);
});

// Exports for determinism verification and testing
// (mirrors POST_JSON_SCHEMA export pattern in evaluate-commit.js)
module.exports = { getISOWeekNumber, selectPillarAndAngle };
