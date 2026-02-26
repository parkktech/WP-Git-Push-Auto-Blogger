'use strict';

const puppeteer = require('puppeteer');

// ─── Screenshot Capture ──────────────────────────────────────────────────────

/**
 * Captures viewport screenshots of the given URLs using Puppeteer.
 *
 * - Returns empty array if urls is falsy or empty (no Puppeteer launch).
 * - Individual URL failures are logged and skipped (graceful degradation).
 * - If Puppeteer fails to launch entirely, returns empty array.
 * - Browser is always closed in the finally block.
 *
 * @param {string[]} urls - Array of URLs to screenshot
 * @returns {Promise<Array<{buffer: Buffer, url: string, mediaType: string}>>}
 */
async function captureScreenshots(urls) {
  if (!urls || urls.length === 0) return [];

  let browser;
  const screenshots = [];

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    for (const url of urls) {
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        const buffer = await page.screenshot({ type: 'png', fullPage: false });
        screenshots.push({ buffer, url, mediaType: 'image/png' });
        await page.close();
      } catch (pageErr) {
        console.warn(`Screenshot failed for ${url}: ${pageErr.message}`);
        // Continue to next URL — don't fail the whole batch
      }
    }
  } catch (launchErr) {
    console.warn(`Puppeteer launch failed: ${launchErr.message} — using stock images only`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {
        // Browser close failure is non-fatal
      }
    }
  }

  return screenshots;
}

// ─── Unsplash Stock Image Search ─────────────────────────────────────────────

/**
 * Searches Unsplash for stock images by keyword and returns image buffers with attribution.
 *
 * - Returns empty array if UNSPLASH_ACCESS_KEY is not set (graceful degradation).
 * - Triggers download_location endpoint for each photo (required by Unsplash guidelines).
 * - Builds attribution HTML with photographer credit and UTM-linked Unsplash URLs.
 * - Uses native fetch() throughout (Node 22 built-in).
 *
 * @param {string} keyword - Search term for stock images
 * @param {number} [count=3] - Number of images to fetch
 * @returns {Promise<Array<{buffer: Buffer, mimeType: string, filename: string, attribution: string}>>}
 */
async function searchUnsplash(keyword, count = 3) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.log('Unsplash not configured — skipping stock images');
    return [];
  }

  try {
    const searchUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=landscape`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Client-ID ${accessKey}` },
    });

    if (!searchResponse.ok) {
      console.warn(`Unsplash search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      return [];
    }

    const data = await searchResponse.json();

    if (!data.results || data.results.length === 0) {
      console.log(`No Unsplash results for "${keyword}"`);
      return [];
    }

    const results = [];

    for (const photo of data.results) {
      try {
        // Trigger download tracking (REQUIRED by Unsplash guidelines)
        try {
          await fetch(photo.links.download_location, {
            headers: { 'Authorization': `Client-ID ${accessKey}` },
          });
        } catch (trackErr) {
          console.warn(`Unsplash download tracking failed for ${photo.id}: ${trackErr.message}`);
          // Still proceed with download — tracking failure is non-fatal
        }

        // Download image bytes (regular size = 1080px wide, optimal for blog posts)
        const imgResponse = await fetch(photo.urls.regular);
        if (!imgResponse.ok) {
          console.warn(`Unsplash image download failed for ${photo.id}: ${imgResponse.status}`);
          continue;
        }

        const buffer = Buffer.from(await imgResponse.arrayBuffer());

        // Build attribution HTML (required by Unsplash guidelines)
        const photographerUrl = `${photo.user.links.html}?utm_source=parkk_blog&utm_medium=referral`;
        const unsplashUrl = 'https://unsplash.com/?utm_source=parkk_blog&utm_medium=referral';
        const attribution = `<p class="photo-credit">Photo by <a href="${photographerUrl}">${photo.user.name}</a> on <a href="${unsplashUrl}">Unsplash</a></p>`;

        results.push({
          buffer,
          mimeType: 'image/jpeg',
          filename: `unsplash-${photo.id}.jpg`,
          attribution,
        });
      } catch (photoErr) {
        console.warn(`Unsplash photo processing failed for ${photo.id}: ${photoErr.message}`);
        // Continue to next photo — don't fail the whole batch
      }
    }

    return results;
  } catch (err) {
    console.warn(`Unsplash search error: ${err.message} — skipping stock images`);
    return [];
  }
}

module.exports = { captureScreenshots, searchUnsplash };
