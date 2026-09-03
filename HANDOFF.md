# Handoff — Modern Redmine Theme

Written 2026-09-03. Read `CLAUDE.md` first — it holds the durable project context
(local server, Propshaft gotchas, code conventions). **This file holds what that one
does not: how to actually verify a visual change, decisions that must not be
silently undone, and what is still open.**

## State at handoff

`main` is clean and pushed to `origin/main`. Last three commits:

| Commit | What |
|---|---|
| `2ba6c50` | Issue-list subject / parent-subject / parent columns forced to one line + ellipsis; `.autoscroll` scrollbar themed |
| `72076b2` | Fixed a wrong claim in `CLAUDE.md` about `#sticky-issue-header` |
| `c32c948` | Added `CLAUDE.md`; corrected stale README claims (fonts, JS size, mobile) |

Working tree has one untracked file, `Screenshot From 2026-09-02 15-51-15.png`, in the
repo root. It is the user's, not build output — leave it alone unless asked.

The local Redmine dev server may still be running on `http://127.0.0.1:3000`
(`admin` / `admin1234`). `pkill -f puma` stops it; `CLAUDE.md` has the start command.

## Verifying a visual change — read this before you measure anything

This is the part that is easy to get wrong, and getting it wrong produces confident
but false conclusions.

### 1. Headless Chrome cannot verify scrollbars or anything that reserves layout space

Headless uses **overlay scrollbars**. They occupy zero layout space and do not render
in screenshots, so a scrolling container looks identical to a clipped one. Measured
in this repo: headless reported `window.innerWidth - documentElement.clientWidth = 0`
for the page scrollbar; real Chrome reported `15`. Passing
`--disable-features=OverlayScrollbar,FluentOverlayScrollbar` did **not** change it.

Run a real browser under a virtual display instead:

```bash
xvfb-run -a --server-args="-screen 0 1600x1000x24" node script.mjs
# ...with puppeteer.launch({ headless: false, ... })
```

`xvfb-run` and `Xvfb` are installed at `/usr/bin`. Headless is still fine for
screenshots of colour, spacing and typography — just not for scrollbars, reserved
widths, or "does this overflow".

### 2. Always run a control on the unmodified CSS

Half the "bugs" here are pre-existing behaviour, and a change can silently introduce
overflow somewhere unrelated. Measure both sides:

```bash
git stash push -m control stylesheets/application.css
#   ...run the measurement script...      → numbers BEFORE
git stash pop        # NOTE: run this from the repo root, not the scratchpad
#   ...run it again...                    → numbers AFTER
```

This is not optional diligence — it is what caught a `min-width: 240px` rule added in
this session that pushed the default `/issues` list from "fits exactly" into 194px of
horizontal scroll for no benefit. It was removed before commit.

### 3. Measurement script

Puppeteer is not installed in this repo; borrow an existing install by symlinking its
`node_modules` **next to the script** (ESM ignores `NODE_PATH`):

```bash
ln -sfn /home/acop/scrapers/jordan-scrapes-secretary-of-states/node_modules ./node_modules
```

```js
// sweep.mjs — regression sweep across the pages that historically break
import puppeteer from 'puppeteer';
const BASE = 'http://127.0.0.1:3000', W = Number(process.env.W || 1440);
const b = await puppeteer.launch({ headless: false,
  args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${W},900`],
  defaultViewport: { width: W, height: 900 } });
const p = await b.newPage();
await p.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await p.type('#username', 'admin'); await p.type('#password', 'admin1234');
await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle2' }),
                   p.click('input[type=submit]')]);
const pages = { 'my-page': '/my/page', issues: '/issues', projects: '/projects',
  'issue-detail': '/issues/21', 'admin-users': '/users', time: '/time_entries',
  'project-settings': '/projects/1/settings' };
for (const [name, path] of Object.entries(pages)) {
  await p.goto(BASE + path, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));
  console.log(name.padEnd(18), JSON.stringify(await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.autoscroll').forEach(a => out.push({
      w: Math.round(a.clientWidth),
      overflow: a.scrollWidth - a.clientWidth,      // >0 means it scrolls
      bar: a.offsetHeight - a.clientHeight - 2 }));  // px of scrollbar actually reserved
    return { autoscrolls: out,
      rowH: Math.round(document.querySelector('table.list tbody tr')
                       ?.getBoundingClientRect().height || 0),
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth };
  })));
}
await b.close();
```

Reference numbers on the current commit (`W=1440`, sidebar expanded):

```
my-page      autoscroll #2: overflow 90,  bar 12
issues       overflow 194, bar 12
admin-users  overflow 100, bar 12
time         overflow 0
projects / issue-detail / project-settings: no .autoscroll
mobile (W=390): bodyOverflow 0 — tables scroll inside their own wrapper
```

To reproduce the wide-list case the last change addressed:

```
/issues?set_filter=1&f[]=parent_id&op[parent_id]=~&v[parent_id][]=2
  &f[]=status_id&op[status_id]=o
  &c[]=project&c[]=tracker&c[]=subject&c[]=parent.subject
  &c[]=priority&c[]=status&c[]=assigned_to&c[]=updated_on
```

## Decisions that must not be silently reverted

- **`/issues` scrolling horizontally by 194px at 1440px is intentional**, not a bug.
  It is the accepted cost of `table.list td.subject { white-space: nowrap }`, which
  took rows on wide lists from 149px to 61px. The user was shown both measured
  options and chose this one. If you think it should change, ask — do not "fix" it.
- **`.autoscroll` is deliberately not `scrollbar-width: thin`.** That bar is the only
  cue that more columns exist off-screen; the previous complaint was precisely that
  people could not find the horizontal scroll.
- **`div#sticky-issue-header` is Redmine core**, not theme code — see `CLAUDE.md`.

## Known, pre-existing, not regressions

- `my page` overflows by 90px and `admin/users` by 100px at 1440px. Both did so
  before any change in this session. Untouched.
- Redmine core throws two JS errors on issue pages, unrelated to the theme:
  `Failed to resolve module specifier "application"` and an invalid selector in
  `setupCopyButtonsToPreElements` (`.wiki pre:not(.pre-wrapper pre)`). Ignore them.
- `max-width` on a `td` is a hint, not a rule — CSS table layout may exceed it.
  Observed: `td.subject` renders 393px wide on My page despite `max-width: 320px`.
  Do not treat that as a bug.

## Open items

1. **Production may be running an older theme.** The user's screenshot from
   `redmine.inctime.com` showed a table clipped at the viewport edge with no
   scrollbar at all. That could not be reproduced locally — locally the wrapper
   stays inside `#content` and does scroll. The local checkout in
   `~/rubydev/redmine6/themes/` had been a month-stale *copy* until it was replaced
   with a symlink this session, so the same may be true of production. Worth
   confirming which commit is deployed there before chasing it as a CSS bug.
2. **Local test fixture was modified.** Issue #2 in `redmine_development` had its
   subject changed to `Email Program Remediation Plan: Template Rebuild, Sending
   Infrastructure, List Warm-Up & Launch Gate` to reproduce the long-parent-subject
   case. It was `Synergized multimedia hardware`. Useful as a fixture; revert if the
   user wants the seed data pristine.
3. **No screenshot tooling is committed.** The README credits Puppeteer for the
   README images, but no script lives in the repo — each session rebuilds one. The
   `screenshots/` PNGs predate the recent table changes.
4. `td.description` and `td.last_notes` were left alone. A rule for them was written
   and then dropped: those columns did not render from the URL params tried, so the
   rule could not be verified. Do not ship it unverified.

## Two mistakes made this session, and the rules from them

- **Declared `#sticky-issue-header` dead code and deleted 61 lines of working CSS.**
  The grep was scoped to this repo only; the element comes from Redmine core. It was
  caught by a browser check showing the element present, and fully reverted.
  → Before deleting a rule, grep `~/rubydev/redmine6/app` for the selector, and
  confirm in a live page that no element matches.
- **Added a `min-width` that regressed a page nobody asked about.** Caught only by
  the control run described above.
  → Never report a visual fix without before/after numbers from the same script.
