// Dev tool: log in to the local Redmine and take screenshots / run a probe.
//
//   node src/shot.mjs OUT_DIR name=/path [name=/path …]
//
// Env: BASE (http://127.0.0.1:3000), W (1440), H (900), MODE (light|dark), SCHEME (id),
//      MOBILE=1 (390×844 touch), FULL=1 (full page), HEADFUL=1 (run under xvfb-run to
//      see real scrollbars), PROBE=file.mjs (default export async (page, name) => any;
//      result is printed as JSON), LS='{"key":"value"}' (extra localStorage).
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const env = process.env;
const BASE = env.BASE || 'http://127.0.0.1:3000';
const mobile = !!env.MOBILE;
const W = Number(env.W || (mobile ? 390 : 1440));
const H = Number(env.H || (mobile ? 844 : 900));
const [out, ...targets] = process.argv.slice(2);
if (!out || !targets.length) {
  console.error('usage: node src/shot.mjs OUT_DIR name=/path …');
  process.exit(2);
}
mkdirSync(out, { recursive: true });
const probe = env.PROBE ? (await import(pathToFileURL(resolve(env.PROBE)).href)).default : null;

const browser = await puppeteer.launch({
  executablePath: env.CHROME || '/usr/bin/google-chrome',
  headless: !env.HEADFUL,
  args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars=false'],
  defaultViewport: { width: W, height: H, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));

const store = Object.assign({}, env.LS ? JSON.parse(env.LS) : {});
if (env.MODE) store['rm-mode'] = env.MODE;
if (env.SCHEME) store['rm-scheme'] = env.SCHEME;
await page.evaluateOnNewDocument((s) => {
  try { for (const k in s) localStorage.setItem(k, s[k]); } catch (e) { /* no storage */ }
}, store);
if (env.MODE) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: env.MODE }]);

if (!env.ANON) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('#username', env.RM_USER || 'admin');
  await page.type('#password', env.RM_PW || 'admin1234');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('#login-submit')]);
}

for (const t of targets) {
  const i = t.indexOf('=');
  const name = t.slice(0, i);
  const path = t.slice(i + 1);
  errors.length = 0;
  await page.goto(BASE + path, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 300));
  let res;
  if (probe) res = await probe(page, name);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: !!env.FULL });
  console.log(name.padEnd(16), probe ? JSON.stringify(res) : 'ok', errors.length ? `JS errors: ${JSON.stringify(errors)}` : '');
}
await browser.close();
