'use strict';

// ─── Brand Identity ────────────────────────────────────────────────────────────

const BRAND = {
  name: 'Parkk Technology',
  author: 'Jason Ratzlaff',
  authorTitle: 'Jason Ratzlaff, founder of Parkk Technology',
  contact: 'https://www.parkktech.com/contact',
  voiceRules: [
    'Never frame AI as the author — always frame as results-driven',
    'Lead with outcomes, not technology stacks',
    'Confident builder tone: direct, no fluff',
    'Urgency is firm factual nudge, never salesy pressure',
    'Show what got built, not how it was built',
  ],
  services: [
    {
      name: 'Custom Software Development',
      tagline: 'We build the software your business actually needs — scoped, shipped, supported.',
    },
    {
      name: 'AI Integration for Existing Businesses',
      tagline: 'Add AI capabilities to what you already have — without rebuilding everything.',
    },
    {
      name: 'Equity Partnership',
      tagline: 'We build for equity — no cash down. Serious builds for serious founders.',
    },
  ],
};

// ─── Urgency Blocks (6 angle variations) ──────────────────────────────────────

const URGENCY_BLOCKS = [
  // 1. Competitive pressure
  {
    angle: 'competitive-pressure',
    text: 'Companies investing in software now are shipping faster, cutting costs, and pulling ahead. The gap between businesses that build and businesses that wait is widening every quarter.',
  },
  // 2. Speed-to-market
  {
    angle: 'speed-to-market',
    text: 'The businesses that move quickly are capturing customers before the market consolidates. Custom software compresses time-to-value — what used to take 18 months now ships in weeks.',
  },
  // 3. Cost-of-waiting
  {
    angle: 'cost-of-waiting',
    text: "Every month you rely on manual processes or off-the-shelf tools that don't quite fit is a month of compounding inefficiency. The cost isn't the build — it's what you're losing by not building.",
  },
  // 4. Talent scarcity
  {
    angle: 'talent-scarcity',
    text: 'Quality engineering capacity is limited. Teams that move now get access to builders who are committed and focused. Waiting means joining a longer queue for less bandwidth.',
  },
  // 5. First-mover advantage
  {
    angle: 'first-mover',
    text: 'In most markets, the first company to operationalize the right software earns a structural advantage that is difficult to replicate. Second-mover catches up slowly, if at all.',
  },
  // 6. Market timing
  {
    angle: 'market-timing',
    text: 'The current environment rewards companies that build durable infrastructure now. Market conditions shift — building during stability is always cheaper than building during pressure.',
  },
];

// ─── FAQ Templates (9 entries) ─────────────────────────────────────────────────

const FAQ_TEMPLATES = [
  // hire-ai-developer intent
  {
    question: 'How much does it cost to hire an AI developer?',
    answerScaffold: 'Cost depends on scope and engagement model. For custom software with AI integration, most projects range from $25,000 to $150,000 for initial development. Parkk Technology also offers equity partnerships — we build for equity, so if budget is a constraint, that conversation is worth having. Start at parkktech.com/contact.',
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'What does an AI development company do?',
    answerScaffold: 'An AI development company builds custom software that incorporates AI capabilities — automating workflows, analyzing data at scale, or adding intelligent features to existing products. Parkk Technology builds full systems: the software, the integrations, and the infrastructure to run it. We focus on outcomes your business can measure.',
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'Should I hire AI developers or build an in-house team?',
    answerScaffold: "Building in-house takes 6-18 months before you have a team that ships consistently. Hiring an AI development firm gets you to a working system in weeks. Most businesses start with an external partner to prove the value, then decide whether to internalize — or keep the partnership because it's more efficient. Parkk Technology builds systems designed to be maintained by whoever you choose.",
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'How do I find a reliable AI developer for my business?',
    answerScaffold: "Look for a team with a portfolio of shipped systems — not concepts or demos. Ask to see real projects with real outcomes. Parkk Technology's portfolio is built from actual commits: every piece of software we ship becomes a documented case study. That's the evidence you should demand from any development partner.",
    searchIntent: 'hire-ai-developer',
  },
  {
    question: 'How long does it take to build a custom AI solution?',
    answerScaffold: 'Scope determines timeline. A focused automation or integration — replacing a manual process with a custom system — typically ships in 4-8 weeks. A full product with AI-native features is 3-6 months. Parkk Technology scopes projects before starting so you have a realistic timeline before committing.',
    searchIntent: 'hire-ai-developer',
  },
  // ai-business-education intent
  {
    question: 'How can AI help my business?',
    answerScaffold: 'AI delivers business value in three ways: automating repetitive work that currently requires human time, surfacing patterns in data that humans miss at scale, and adding intelligent features to customer-facing products. The right application depends on where your business has the most friction. Parkk Technology helps identify that before proposing anything.',
    searchIntent: 'ai-business-education',
  },
  {
    question: 'What kinds of businesses benefit most from AI integration?',
    answerScaffold: 'Businesses with high-volume repetitive tasks, large data sets they are not fully using, or customer-facing processes that feel slow or manual all see clear ROI from AI integration. Industry is less important than process maturity — a well-documented workflow is easier to automate than a chaotic one.',
    searchIntent: 'ai-business-education',
  },
  {
    question: 'Do I need to rebuild my existing software to add AI?',
    answerScaffold: 'Usually not. Most AI capabilities are added as integrations alongside existing systems — APIs, data connectors, and processing layers that sit in front of or behind what you already have. A full rebuild is rarely necessary and often counterproductive. Parkk Technology specializes in integration-first approaches that preserve what works.',
    searchIntent: 'ai-business-education',
  },
  {
    question: 'What is the ROI of custom software development?',
    answerScaffold: 'Custom software ROI is measured in time saved, errors eliminated, and revenue enabled. A system that saves 40 hours per week at $50/hour pays for itself in under a year. Revenue-enabling software — new capabilities, faster delivery, better customer experience — has ROI that compounds. Parkk Technology builds with measurable outcomes as the design constraint.',
    searchIntent: 'ai-business-education',
  },
];

// ─── CTA Pool ──────────────────────────────────────────────────────────────────

const CTA_POOL = [
  {
    heading: "Ready to build? Let's talk.",
    body: "Don't wait while competitors ship. Get a free consultation with Jason Ratzlaff and leave with a clear picture of what your build would look like. No obligation.",
    url: 'https://www.parkktech.com/contact',
    action: 'Get your free consultation',
  },
  {
    heading: 'Start your build this month.',
    body: 'Parkk Technology has capacity for one new project. If your business needs custom software or AI integration, now is the time to reach out — not next quarter.',
    url: 'https://www.parkktech.com/contact',
    action: 'Claim your consultation slot',
  },
  {
    heading: 'No budget? Ask about equity.',
    body: "We build for equity — no cash down. If you have a serious business problem and a serious commitment to solving it, reach out. We'll tell you honestly whether it's a fit.",
    url: 'https://www.parkktech.com/contact',
    action: 'Explore the equity model',
  },
  {
    heading: 'One conversation changes the roadmap.',
    body: 'Most businesses we work with arrive with a vague idea and leave with a scoped plan. The consultation is free. The clarity is immediate.',
    url: 'https://www.parkktech.com/contact',
    action: 'Book your free consultation',
  },
];

// ─── Rotation Functions ────────────────────────────────────────────────────────

let urgencyIndex = 0;

/**
 * Returns the next urgency block in rotation.
 * Successive calls return different blocks cycling through all 6 angles.
 */
function getUrgencyBlock() {
  const block = URGENCY_BLOCKS[urgencyIndex % URGENCY_BLOCKS.length];
  urgencyIndex++;
  return block;
}

/**
 * Returns a shuffled selection of FAQ templates.
 * @param {number} [count] - Number of FAQs to return. Defaults to all (shuffled).
 * @returns {Array} FAQ template objects with question, answerScaffold, searchIntent
 */
function getRandomFAQs(count) {
  const shuffled = [...FAQ_TEMPLATES].sort(() => Math.random() - 0.5);
  return count !== undefined ? shuffled.slice(0, count) : shuffled;
}

/**
 * Returns a random CTA block.
 * All returned CTAs include parkktech.com/contact URL.
 */
function getRandomCTA() {
  return CTA_POOL[Math.floor(Math.random() * CTA_POOL.length)];
}

/**
 * Post kit: the only HTML components a post may use beyond h2/h3/p/ul/ol/table.
 * Styles live in the solutic-child theme (assets/parkk.css, "Post kit"). Keep in sync with CLAUDE.md.
 */
const POST_KIT = `Build htmlContent with the Parkk post kit so the post is visual, not a wall of text:
- Every post MUST include at least: one pk-splits results band OR one pk-sheet timing chart built from REAL numbers in the source material, one pk-pit callout, and the FAQ as a pk-faqs accordion. Longer posts add pk-vs and pk-stack where real data exists.
- NEVER invent numbers. If the source has no figures, use pk-vs to compare approaches qualitatively instead of charts.
- Results band: <div class="pk-splits"><div><b>3.8×</b><span>faster home page</span><i>2,911 ms → 775 ms</i></div>…3–4 items…</div>
- Before/after chart (numbers only, no units in the variables): <div class="pk-sheet" style="--max:3000"><p class="pk-sheet__title">What is measured</p><p class="pk-sheet__sub">How it was measured</p><p class="pk-sheet__key"><span>Before</span><span>After</span></p><div class="pk-sheet__row" style="--a:2911;--b:775"><span class="pk-sheet__name">Home page</span><span class="pk-sheet__bars"><i class="pk-bar pk-bar--ref"></i><i class="pk-bar pk-bar--new"></i></span><span class="pk-sheet__time"><s>2,911 ms</s><b>775 ms</b></span></div>…</div>  (--max must be ≥ the largest value; add class is-slower to a row that got worse)
- Side by side: <div class="pk-vs"><div class="pk-vs__side"><p class="pk-vs__head">Old way</p><span class="pk-vs__tag">context</span><dl><div><dt>Metric</dt><dd>value</dd></div>…</dl></div><div class="pk-vs__side pk-vs__side--ours"><p class="pk-vs__head">Our way</p><span class="pk-vs__tag">context</span><dl>…same rows…</dl></div></div>
- Breakdown bar: <div class="pk-stack" style="--total:217"><p class="pk-stack__title">What the parts are</p><div class="pk-stack__bar"><span style="--v:119">Label 119</span><span style="--v:71">Label 71</span></div><ul class="pk-stack__legend"><li><b>119</b> label</li>…</ul></div>
- Key point: <div class="pk-pit"><strong>One-sentence takeaway</strong><p>Why it matters.</p></div>  Honest limitation: add class pk-pit--caution.
- Code: <figure class="pk-code"><figcaption>Terminal: what this does</figcaption><pre><code>…</code></pre></figure>
- Steps (only for a real sequence): <ol class="pk-steps"><li><strong>Step</strong> detail</li>…</ol>
- FAQ: <h2>Frequently Asked Questions</h2><div class="pk-faqs"><details class="pk-faq"><summary>Question?</summary><p>Answer.</p></details>…</div>
- CTA: <div class="pk-cta"><h2>Headline</h2><p>One or two sentences.</p><p><a class="pk-btn" href="https://www.parkktech.com/contact/">Start the conversation</a></p></div>
- Do NOT use: eyebrow/kicker labels above headings, emoji or unicode icons, gradient text, "→" appended to links, inline style other than the --a/--b/--max/--v/--total variables.`;

module.exports = { BRAND, getUrgencyBlock, getRandomFAQs, getRandomCTA, POST_KIT };
