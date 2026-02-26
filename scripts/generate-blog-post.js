'use strict';

const { shouldSkipCommit, evaluateWorthiness, generateBlogPost, WORTHINESS_THRESHOLD } = require('./evaluate-commit');
const { captureScreenshots, searchUnsplash } = require('./media-pipeline');
const { uploadMedia, createWordPressPost } = require('./wp-client');

// ─── Telegram Notification ───────────────────────────────────────────────────

/**
 * Sends a Telegram notification about a newly created blog post draft.
 *
 * - Non-fatal: entire function is wrapped in try/catch. Telegram failure
 *   NEVER causes the pipeline to exit with an error.
 * - Graceful skip: if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing,
 *   logs and returns without error.
 * - Uses native fetch() to Telegram Bot API (no library).
 * - HTML parse mode with proper escaping for user-generated text.
 *
 * @param {string} postUrl - WordPress draft URL
 * @param {number} score - Worthiness score (1-10)
 * @param {string} postTitle - Blog post title (user-generated, needs escaping)
 */
async function sendTelegramNotification(postUrl, score, postTitle) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('Telegram not configured — skipping notification');
    return;
  }

  // Escape HTML special characters in user-generated text (see Pitfall 6 from research)
  const safeTitle = postTitle
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const message = [
    '<b>New blog post draft created</b>',
    '',
    `<b>Title:</b> ${safeTitle}`,
    `<b>Worthiness score:</b> ${score}/10`,
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

// ─── Main Pipeline Orchestrator ──────────────────────────────────────────────

async function main() {
  // Read inputs from environment
  const commitMessage = process.env.COMMIT_MESSAGE;
  const diff = process.env.COMMIT_DIFF;
  const commitAuthor = process.env.COMMIT_AUTHOR || null;

  if (!commitMessage || !diff) {
    throw new Error('COMMIT_MESSAGE and COMMIT_DIFF environment variables are required');
  }

  // Step 1 — Skip check
  if (shouldSkipCommit(commitMessage, commitAuthor)) {
    console.log('Skipping commit: matches skip pattern');
    process.exit(0);
  }

  // Step 2 — Worthiness evaluation
  const evaluation = await evaluateWorthiness(commitMessage, diff);
  console.log(`Worthiness: ${evaluation.score}/10 — ${evaluation.topic_summary}`);

  if (evaluation.score < WORTHINESS_THRESHOLD) {
    console.log(`Skipping commit: worthiness score ${evaluation.score} below threshold ${WORTHINESS_THRESHOLD}`);
    process.exit(0);
  }

  // Step 3 — Media acquisition (parallel)
  const urls = process.env.SCREENSHOT_URLS
    ? process.env.SCREENSHOT_URLS.split(',').map(u => u.trim()).filter(Boolean)
    : [];

  const [screenshots, stockImages] = await Promise.all([
    captureScreenshots(urls),
    searchUnsplash(evaluation.topic_summary, 3), // always search — supplement, not just fallback
  ]);

  // Step 4 — Blog post generation
  const post = await generateBlogPost(commitMessage, diff, evaluation, screenshots);

  // Step 5 — Append Unsplash attribution to post content
  if (stockImages.length > 0) {
    const attributionBlock = stockImages
      .map(img => `<p class="photo-credit">${img.attribution}</p>`)
      .join('\n');
    post.htmlContent += `\n\n<!-- Unsplash Attribution -->\n${attributionBlock}`;
  }

  // Step 6 — Upload media to WordPress
  const allImages = [
    ...screenshots.map((s, i) => ({ buffer: s.buffer, filename: `screenshot-${i + 1}.png`, mimeType: 'image/png' })),
    ...stockImages.map(s => ({ buffer: s.buffer, filename: s.filename, mimeType: s.mimeType })),
  ];

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

  // Step 7 — Create WordPress post
  const wpPost = await createWordPressPost(post, mediaIds);
  console.log(`Post created: ${wpPost.link}`);

  // Step 8 — Send Telegram notification
  await sendTelegramNotification(wpPost.link, evaluation.score, post.title);

  // Step 9 — Output summary
  console.log(JSON.stringify({
    postId: wpPost.id,
    postUrl: wpPost.link,
    worthinessScore: evaluation.score,
    title: post.title,
    status: wpPost.status,
  }));
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('Pipeline failed:', err.message);
  process.exit(1);
});
