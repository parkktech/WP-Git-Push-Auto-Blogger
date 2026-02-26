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
// Part D — Post creation with SEO meta
// ---------------------------------------------------------------------------

/**
 * Create a WordPress post with full metadata including SEO fields.
 *
 * Resolves category slugs and tag strings to integer IDs internally,
 * builds the SEO meta object based on the active plugin, and POSTs
 * the complete payload to /wp/v2/posts.
 *
 * @param {Object} post - Post data object
 * @param {string} post.title          - Post title
 * @param {string} post.slug           - URL slug
 * @param {string} post.htmlContent    - Full HTML content body
 * @param {string} post.excerpt        - Post excerpt
 * @param {string} post.seoTitle       - SEO title (may differ from post title)
 * @param {string} post.metaDescription - Meta description for search results
 * @param {string} post.focusKeyword   - Primary focus keyword
 * @param {string[]} post.secondaryKeywords - Secondary keywords (informational)
 * @param {string[]} post.categories   - Category slug strings
 * @param {string[]} post.tags         - Tag display strings
 * @param {number[]} mediaIds          - WordPress media IDs (first becomes featured image)
 * @param {string}  [seoPlugin]        - 'yoast', 'rankmath', or 'both' (default)
 * @returns {Promise<Object>} Full WordPress response JSON (id, link, status, etc.)
 */
async function createWordPressPost(post, mediaIds, seoPlugin) {
  // 1. Resolve taxonomy slugs/strings to WordPress integer IDs
  const categoryIds = await resolveCategoryIds(post.categories);
  const tagIds = await resolveOrCreateTagIds(post.tags);

  // 2. Build SEO meta object based on the active plugin
  const meta = {};
  const plugin = seoPlugin || process.env.WORDPRESS_SEO_PLUGIN || 'both';

  if (plugin === 'yoast' || plugin === 'both') {
    meta['_yoast_wpseo_metadesc'] = post.metaDescription;
    meta['_yoast_wpseo_focuskw'] = post.focusKeyword;
    meta['_yoast_wpseo_title'] = post.seoTitle;
  }
  if (plugin === 'rankmath' || plugin === 'both') {
    meta['rank_math_focus_keyword'] = post.focusKeyword;
    meta['rank_math_description'] = post.metaDescription;
    meta['rank_math_title'] = post.seoTitle;
  }

  // 3. Build the post payload
  const payload = {
    title: post.title,
    slug: post.slug,
    content: post.htmlContent,
    excerpt: post.excerpt,
    status: process.env.PUBLISH_STATUS || 'draft',
    categories: categoryIds,
    tags: tagIds,
    featured_media: mediaIds.length > 0 ? mediaIds[0] : 0,
    meta,
  };

  // 4. POST to WordPress
  const response = await fetch(`${getApiUrl()}/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${getAuth()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Post creation failed (${response.status}): ${body}`);
  }

  const result = await response.json();
  console.log(`WordPress post created: ${result.link} (status: ${result.status})`);
  return result;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { uploadMedia, resolveCategoryIds, resolveOrCreateTagIds, createWordPressPost };
