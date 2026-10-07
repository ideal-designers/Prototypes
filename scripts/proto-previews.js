#!/usr/bin/env node
/**
 * Captures dashboard thumbnails → src/assets/previews/{slug}.jpg (640×400).
 *
 * Uses the locally installed Google Chrome in headless mode + macOS `sips` for
 * resizing, so no extra npm dependencies are needed.
 *
 * 1. Start the dev server:   npm start            (local env has no password gate)
 * 2. Capture:                node scripts/proto-previews.js [slug ...] [--base http://localhost:4200]
 * 3. Refresh metadata:       node scripts/proto-meta.js   (flags which slugs have a preview)
 *
 * Without slugs it captures every prototype in proto-registry.ts that has a route.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/assets/previews');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORT = { w: 1440, h: 900 };
const THUMB_W = 640;

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const BASE = baseIdx >= 0 ? args.splice(baseIdx, 2)[1] : 'http://localhost:4200';

const routes = fs.readFileSync(path.join(ROOT, 'src/app/app.routes.ts'), 'utf8');
const registry = [...fs.readFileSync(path.join(ROOT, 'src/app/proto-registry.ts'), 'utf8')
  .matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const slugs = (args.length ? args : registry).filter(s => routes.includes(`path: '${s}'`));

if (!fs.existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME} — set CHROME_PATH`);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proto-previews-'));

/** Headless Chrome writes the screenshot but may not exit while the dev server keeps
 *  a live-reload socket open — so wait for the file, then kill the process. */
function capture(url, png) {
  return new Promise((resolve, reject) => {
    const chrome = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--run-all-compositor-stages-before-draw',
      `--user-data-dir=${path.join(tmpDir, 'profile')}`,
      `--window-size=${VIEWPORT.w},${VIEWPORT.h}`,
      '--virtual-time-budget=4000',
      `--screenshot=${png}`,
      url,
    ], { stdio: 'ignore' });
    const started = Date.now();
    const timer = setInterval(() => {
      const done = fs.existsSync(png) && fs.statSync(png).size > 0;
      if (done || Date.now() - started > 45000) {
        clearInterval(timer);
        chrome.kill('SIGKILL');
        done ? setTimeout(resolve, 300) : reject(new Error('timed out'));
      }
    }, 250);
    chrome.on('error', err => { clearInterval(timer); reject(err); });
  });
}

(async () => {
  for (const slug of slugs) {
    const png = path.join(tmpDir, `${slug}.png`);
    const jpg = path.join(OUT_DIR, `${slug}.jpg`);
    try {
      await capture(`${BASE}/${slug}`, png);
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72',
        '--resampleWidth', String(THUMB_W), png, '--out', jpg], { stdio: 'ignore' });
      console.log(`✓ ${slug}`);
    } catch (err) {
      console.warn(`✗ ${slug}: ${err.message}`);
    }
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Done → ${path.relative(ROOT, OUT_DIR)}. Now run: node scripts/proto-meta.js`);
})();
