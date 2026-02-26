'use strict';

const { Anthropic } = require('@anthropic-ai/sdk');
const { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA } = require('./brand-voice');

// ─── Anthropic Client (module-level singleton) ──────────────────────────────

const client = new Anthropic();

// ─── Constants ──────────────────────────────────────────────────────────────

const WORTHINESS_THRESHOLD = parseInt(process.env.MIN_WORTHINESS_SCORE || '7', 10);

const WORTHINESS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    reasoning: { type: 'string' },
    topic_summary: { type: 'string' },
  },
  required: ['score', 'reasoning', 'topic_summary'],
  additionalProperties: false,
};

const POST_JSON_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slug: { type: 'string' },
    seoTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    focusKeyword: { type: 'string' },
    secondaryKeywords: { type: 'array', items: { type: 'string' } },
    excerpt: { type: 'string' },
    htmlContent: { type: 'string' },
    categories: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    answerFirstBlock: { type: 'string' },
    faqItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['question', 'answer'],
        additionalProperties: false,
      },
    },
    blogPostingSchema: { type: 'string' },
    faqPageSchema: { type: 'string' },
  },
  required: [
    'title',
    'slug',
    'seoTitle',
    'metaDescription',
    'focusKeyword',
    'excerpt',
    'htmlContent',
    'categories',
    'tags',
    'answerFirstBlock',
    'faqItems',
    'blogPostingSchema',
    'faqPageSchema',
  ],
  additionalProperties: false,
};

// ─── Skip Pattern Detection ─────────────────────────────────────────────────

/**
 * Determines whether a commit should be skipped (no blog post generated).
 *
 * Returns true for:
 * - Dependabot or dependabot[bot] author
 * - Merge commits (message starts with "Merge ")
 * - Conventional commit noise types: chore, ci, docs, style, test, build, revert
 * - Explicit [skip-blog] tag in commit message
 *
 * @param {string} commitMessage - The commit message text
 * @param {string|null} authorLogin - The commit author's login/username
 * @returns {boolean} true if the commit should be skipped
 */
function shouldSkipCommit(commitMessage, authorLogin) {
  // Skip dependabot commits
  if (authorLogin && authorLogin.includes('dependabot')) return true;

  // Skip merge commits
  if (commitMessage.startsWith('Merge ')) return true;

  // Skip conventional commit noise types (case-insensitive, with optional scope)
  if (/^(chore|ci|docs|style|test|build|revert)(\(.+\))?:/i.test(commitMessage)) return true;

  // Skip explicit opt-out
  if (commitMessage.includes('[skip-blog]')) return true;

  return false;
}

// ─── Worthiness Evaluation ──────────────────────────────────────────────────

/**
 * Evaluates a commit's worthiness for a blog post using Claude API.
 *
 * Calls Claude with structured outputs to score the commit 1-10 on how
 * interesting/valuable it would be as a portfolio blog post demonstrating
 * technical capability to potential clients.
 *
 * @param {string} commitMessage - The commit message text
 * @param {string} diff - The commit diff content
 * @returns {Promise<{score: number, reasoning: string, topic_summary: string}>}
 */
async function evaluateWorthiness(commitMessage, diff) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system:
      'You are a content worthiness evaluator for a software development portfolio blog. ' +
      'Score each commit on a scale of 1-10 based on how interesting and valuable it would be ' +
      'as a blog post demonstrating technical capability to potential clients. ' +
      'Consider: Does this show meaningful engineering work? Would a potential client find this impressive? ' +
      'Is there enough substance for a 1500-2500 word post about outcomes and business value? ' +
      'Score 7+ means "worth writing about". Score below 7 means "skip".',
    messages: [
      {
        role: 'user',
        content: `Evaluate this git commit for blog post worthiness.\n\nCommit message: ${commitMessage}\n\nDiff:\n${diff}`,
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: WORTHINESS_JSON_SCHEMA,
      },
    },
  });

  const result = JSON.parse(response.content[0].text);
  console.log(`Worthiness: ${result.score}/10 — ${result.reasoning}`);
  return result;
}

// ─── System Prompt Builder ──────────────────────────────────────────────────

/**
 * Builds the system prompt for blog post generation.
 *
 * Incorporates brand identity, voice rules, portfolio framing, answer-first
 * instruction, FAQ generation, schema generation, and all locked content decisions.
 *
 * @param {object} brand - BRAND object from brand-voice.js
 * @param {object} urgencyBlock - Urgency block with angle and text
 * @param {Array} faqs - FAQ template objects with question, answerScaffold, searchIntent
 * @param {object} cta - CTA block with heading, body, url, action
 * @returns {string} The complete system prompt
 */
function buildSystemPrompt(brand, urgencyBlock, faqs, cta) {
  const voiceRulesText = brand.voiceRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n');

  const servicesText = brand.services
    .map((svc) => `- ${svc.name}: ${svc.tagline}`)
    .join('\n');

  const faqTemplatesText = faqs
    .map(
      (faq) =>
        `- Q: ${faq.question}\n  Sample answer direction: ${faq.answerScaffold}\n  Search intent: ${faq.searchIntent}`
    )
    .join('\n');

  return `You are a blog post writer for ${brand.name}, a software development and AI integration company.
Author: ${brand.author}
Author title: ${brand.authorTitle}

VOICE RULES — follow these strictly:
${voiceRulesText}

SERVICES offered by ${brand.name}:
${servicesText}

PORTFOLIO FRAMING:
Every blog post is a portfolio piece. Frame the commit's work as demonstrating technical capability to potential clients. Reference the specific project being built (provided in the user message as PROJECT_NAME, PROJECT_URL, PROJECT_DESCRIPTION). Show outcomes and business value — never implementation details or code snippets.

CONTENT STRUCTURE:
- Target 1500-2500 words
- Use keyword-rich H2 and H3 headings optimized for search queries related to the topic
- No code snippets — write about outcomes, business value, and what was achieved
- Write in a confident, direct builder tone

ANSWER-FIRST BLOCK:
Generate an "answerFirstBlock" field containing exactly 40-60 words that directly answers the core question implied by the post topic. This block is optimized for AI Overview snippets — it should be a standalone, self-contained answer that makes sense without reading the full post.

FAQ SECTION:
Generate 3-5 FAQ items (faqItems array). Use the following FAQ templates as inspiration — adapt the questions and answers to be specifically relevant to the commit topic and post content:
${faqTemplatesText}
Do NOT copy the templates verbatim. Adapt each question to relate to the specific topic of this blog post while maintaining the same search intent categories.

URGENCY BLOCK:
Include the following urgency message naturally within the post body (not as a separate section — weave it into the narrative):
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
   - datePublished: today's date in ISO format (provided in user message)
   - keywords: array of relevant keywords

2. faqPageSchema: Generate a complete FAQPage JSON-LD as a string containing a <script type="application/ld+json"> tag. Include:
   - @context: https://schema.org
   - @type: FAQPage
   - mainEntity: array of Question objects, each with name (question text) and acceptedAnswer (Answer with text)
   Use the same FAQ items from the faqItems array.

CATEGORIES AND TAGS:
- Generate 2-3 category slugs (e.g., "web-development", "ai-integration", "portfolio")
- Generate 3-5 tag strings relevant to the post topic

OUTPUT FORMAT:
Return a JSON object matching the provided schema exactly. The htmlContent field should contain the full post HTML (all sections, headings, paragraphs, CTA). The blogPostingSchema and faqPageSchema fields should each be complete <script type="application/ld+json"> tag strings.`;
}

// ─── Blog Post Generation ───────────────────────────────────────────────────

/**
 * Generates a complete blog post from a commit using Claude API.
 *
 * Calls Claude with structured outputs to produce the full post JSON including
 * title, slug, SEO meta, HTML content, categories, tags, answer-first block,
 * FAQ items, and JSON-LD schema markup.
 *
 * @param {string} commitMessage - The commit message text
 * @param {string} diff - The commit diff content
 * @param {{score: number, reasoning: string, topic_summary: string}} evaluation - Worthiness evaluation result
 * @param {Array<{buffer: Buffer, mediaType: string}>} screenshotBuffers - Screenshot images to send to Claude
 * @returns {Promise<object>} Complete blog post JSON matching POST_JSON_SCHEMA
 */
async function generateBlogPost(commitMessage, diff, evaluation, screenshotBuffers) {
  const urgencyBlock = getUrgencyBlock();
  const faqs = getRandomFAQs(3);
  const cta = getRandomCTA();

  const systemPrompt = buildSystemPrompt(BRAND, urgencyBlock, faqs, cta);

  // Build image content blocks from screenshot buffers
  const imageBlocks = (screenshotBuffers || []).map(({ buffer, mediaType }) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType || 'image/png',
      data: buffer.toString('base64'),
    },
  }));

  // Build user message content array
  const today = new Date().toISOString().split('T')[0];
  const projectName = process.env.PROJECT_NAME || '';
  const projectUrl = process.env.PROJECT_URL || '';
  const projectDescription = process.env.PROJECT_DESCRIPTION || '';

  const textBlock = {
    type: 'text',
    text: `Generate a blog post for this commit.

Commit message: ${commitMessage}

Diff:
${diff}

Worthiness score: ${evaluation.score}/10
Topic summary: ${evaluation.topic_summary}

PROJECT_NAME: ${projectName}
PROJECT_URL: ${projectUrl}
PROJECT_DESCRIPTION: ${projectDescription}

Today's date (ISO): ${today}`,
  };

  const userContent = [...imageBlocks, textBlock];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userContent,
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
  if (
    post.blogPostingSchema &&
    !post.htmlContent.includes('BlogPosting')
  ) {
    post.htmlContent += '\n' + post.blogPostingSchema;
  }

  if (
    post.faqPageSchema &&
    !post.htmlContent.includes('FAQPage')
  ) {
    post.htmlContent += '\n' + post.faqPageSchema;
  }

  return post;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  shouldSkipCommit,
  evaluateWorthiness,
  generateBlogPost,
  WORTHINESS_THRESHOLD,
  POST_JSON_SCHEMA,
};
