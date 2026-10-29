// Regenerates the README screenshots from a local Redmine with seed data.
//
//   cd src && ln -sfn /path/to/node_modules-with-puppeteer node_modules
//   CHROME=/path/to/chrome-147 node screenshots.mjs        # BASE=http://127.0.0.1:3000
//
// Needs a current Chrome (CSS color-mix()); old bundled Chromium renders fallbacks.
// Never point this at a production Redmine — the images show real names and data.
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');
const ISSUE = process.env.ISSUE || '21';
const PROJECT = process.env.PROJECT || 'schimmel13';

const b = await puppeteer.launch({ executablePath: process.env.CHROME, headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 900 } });
const p = await b.newPage();
await p.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await p.type('#username', process.env.RM_USER || 'admin');
await p.type('#password', process.env.RM_PASS || 'admin1234');
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }), p.click('input[type=submit]')]);

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function mode(dark, scheme = '') {
  await p.evaluate((d, s) => {
    localStorage.setItem('rm-dark', d ? '1' : '0');
    s ? localStorage.setItem('rm-scheme', s) : localStorage.removeItem('rm-scheme');
    localStorage.removeItem('rm-scheme-gogh');
    localStorage.setItem('rm-scheme-recent', JSON.stringify(['', 'dracula', 'gruvbox-light', 'tokyo-night']));
  }, dark, scheme);
}
async function shot(name, url, before) {
  await p.goto(BASE + url, { waitUntil: 'networkidle2' });
  await p.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  if (before) await before();
  await p.mouse.move(1, 899);
  await sleep(400);
  await p.screenshot({ path: path.join(OUT, name + '.png') });
  console.log('  ', name);
}

const pages = {
  'my-page': `/my/page`,
  'projects': `/projects`,
  'issues': `/issues`,
  'issue-detail': `/issues/${ISSUE}`,
  'issue-edit': `/issues/${ISSUE}/edit`,
  'activity': `/activity?from=2025-04-12`,
  'project-settings': `/projects/${PROJECT}/settings`,
  'admin': `/admin`,
};
const lightOnly = { 'news': `/news`, 'admin-users': `/users` };

for (const dark of [false, true]) {
  await mode(dark);
  const m = dark ? 'dark' : 'light';
  for (const [n, u] of Object.entries(pages)) await shot(`${m}-${n}`, u);
  if (!dark) for (const [n, u] of Object.entries(lightOnly)) await shot(`${m}-${n}`, u);
  if (!dark) await shot(`${m}-filters`, `/issues`, async () => {
    await p.evaluate(() => { const o = document.querySelector('#options.collapsed legend'); o && o.click(); });
  });
  await shot(`${m}-watchers-modal`, `/issues/${ISSUE}`, async () => {
    await p.click('#watchers a[href$="/watchers/new"], a[href*="watchers/new"]');
    await p.waitForSelector('.ui-dialog', { visible: true });
    await sleep(300);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
  });
}

// Colour schemes
await mode(false);
await shot('light-account-menu', `/issues`, async () => {
  await p.click('.rm-account-trigger');
  await sleep(300);
});
await shot('light-scheme-picker', `/my/account`, async () => {
  await p.evaluate(() => { const r = document.querySelector('#rm-schemes').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 70); });
});
await mode(true);
await shot('dark-gogh-search', `/my/account`, async () => {
  await p.type('.rm-gogh-search', 'gruvbox material');
  await p.waitForFunction(() => /match/.test(document.querySelector('.rm-gogh-status').textContent));
  await p.click('.rm-gogh-results [data-gogh-name="Gruvbox Material Dark"]');
  await sleep(300);
  await p.evaluate(() => { const r = document.querySelector('.rm-gogh').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 70); document.activeElement.blur(); });
});
for (const [id, dark] of [['dracula', true], ['gruvbox-dark', true], ['tokyo-night', true],
                          ['gruvbox-light', false], ['solarized-light', false], ['rose-pine-dawn', false]]) {
  await mode(dark, id);
  await shot(`scheme-${id}`, `/issues/${ISSUE}`);
}
await b.close();
