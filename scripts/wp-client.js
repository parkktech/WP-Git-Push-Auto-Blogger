/**
 * WordPress REST API Client
 *
 * Handles media uploads, category/tag resolution, and post creation
 * with SEO meta field support for Yoast and RankMath.
 *
 * Exports: uploadMedia, resolveCategoryIds, resolveOrCreateTagIds, createWordPressPost
 *
 * Required env vars:
 *   WP_API_URL          - WordPress REST API base URL (e.g., https://parkktech.com/wp-json)
 *   WP_USER             - WordPress username with publish_posts + upload_files capabilities
 *   WP_APP_PASSWORD     - WordPress Application Password
 *   WORDPRESS_SEO_PLUGIN - 'yoast', 'rankmath', or 'both' (optional, defaults to 'both')
 *   PUBLISH_STATUS       - Post status: 'draft', 'publish', 'pending' (optional, defaults to 'draft')
 */

'use strict';

// ---------------------------------------------------------------------------
// Auth helpers (module-level)
// ---------------------------------------------------------------------------

function getAuth() {
  return Buffer.from(`${process.env.WP_USER}:${process.env.WP_APP_PASSWORD}`).toString('base64');
}

function getApiUrl() {
  return process.env.WP_API_URL; // e.g., https://parkktech.com/wp-json
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Convert a slug like 'web-development' to title case 'Web Development'.
 */
function slugToName(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Part A — Media upload
// ---------------------------------------------------------------------------

/**
 * Upload a binary image buffer to the WordPress media library.
 *
 * Uses raw binary POST with Content-Type and Content-Disposition headers
 * (NOT multipart form-data).
 *
 * @param {Buffer} imageBuffer - Raw image bytes
 * @param {string} filename    - Desired filename (e.g., 'screenshot-1.png')
 * @param {string} mimeType    - MIME type (default 'image/png')
 * @returns {Promise<{id: number, url: string}>} WordPress media object
 */
async function uploadMedia(imageBuffer, filename, mimeType = 'image/png') {
  const response = await fetch(`${getApiUrl()}/wp/v2/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${getAuth()}`,
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Media upload failed (${response.status}): ${body}`);
  }

  const media = await response.json();
  return { id: media.id, url: media.source_url };
}

// ---------------------------------------------------------------------------
// Part B — Category resolution
// ---------------------------------------------------------------------------

/**
 * Resolve an array of category slug strings to WordPress integer IDs.
 * Creates any categories that do not already exist.
 *
 * @param {string[]} categorySlugs - e.g., ['web-development', 'portfolio']
 * @returns {Promise<number[]>} Array of WordPress category IDs
 */
async function resolveCategoryIds(categorySlugs) {
  const ids = [];

  for (const slug of categorySlugs) {
    // Search for existing category by slug
    const searchRes = await fetch(
      `${getApiUrl()}/wp/v2/categories?slug=${encodeURIComponent(slug)}`,
      { headers: { 'Authorization': `Basic ${getAuth()}` } }
    );
    const existing = await searchRes.json();

    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      // Create the category — use title-cased name from slug
      const createRes = await fetch(`${getApiUrl()}/wp/v2/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getAuth()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: slugToName(slug), slug }),
      });

      if (!createRes.ok) {
        const body = await createRes.text();
        throw new Error(`Category creation failed for "${slug}" (${createRes.status}): ${body}`);
      }

      const created = await createRes.json();
      ids.push(created.id);
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Part C — Tag resolution
// ---------------------------------------------------------------------------

/**
 * Resolve an array of tag strings to WordPress integer IDs.
 * Creates any tags that do not already exist.
 *
 * @param {string[]} tagStrings - e.g., ['React', 'Node.js', 'web development']
 * @returns {Promise<number[]>} Array of WordPress tag IDs
 */
async function resolveOrCreateTagIds(tagStrings) {
  const ids = [];

  for (const tag of tagStrings) {
    // Generate a URL-safe slug from the tag string
    const slug = tag
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Search for existing tag by slug
    const searchRes = await fetch(
      `${getApiUrl()}/wp/v2/tags?slug=${encodeURIComponent(slug)}`,
      { headers: { 'Authorization': `Basic ${getAuth()}` } }
    );
    const existing = await searchRes.json();

    if (existing.length > 0) {
      ids.push(existing[0].id);
    } else {
      // Create the tag — preserve original casing for the display name
      const createRes = await fetch(`${getApiUrl()}/wp/v2/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getAuth()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: tag, slug }),
      });

      if (!createRes.ok) {
        const body = await createRes.text();
        throw new Error(`Tag creation failed for "${tag}" (${createRes.status}): ${body}`);
      }

      const created = await createRes.json();
      ids.push(created.id);
    }
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { uploadMedia, resolveCategoryIds, resolveOrCreateTagIds };
