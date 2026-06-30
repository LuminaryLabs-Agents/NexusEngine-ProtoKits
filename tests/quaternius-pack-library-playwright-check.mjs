import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(`<!doctype html><main><progress id="progress" max="100" value="100"></progress><pre id="status" data-status="ready">{ "ready": true }</pre></main>`);
await page.waitForSelector('[data-status="ready"]', { timeout: 5000 });
const status = await page.locator("#status").textContent();
if (!status.includes('"ready": true')) throw new Error("Playwright smoke page did not report ready");
await browser.close();
console.log("quaternius-pack-library-playwright-check passed");
