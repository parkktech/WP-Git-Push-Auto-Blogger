'use strict';

const { Anthropic } = require('@anthropic-ai/sdk');

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

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { shouldSkipCommit, evaluateWorthiness, WORTHINESS_THRESHOLD };
