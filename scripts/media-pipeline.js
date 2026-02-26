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

module.exports = { captureScreenshots };
