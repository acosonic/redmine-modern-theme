# Handoff — Modern Redmine Theme

Written 2026-09-03, last updated 2026-11-12. Read `CLAUDE.md` first — it holds the durable project context
(local server, Propshaft gotchas, code conventions). **This file holds what that one
does not: how to actually verify a visual change, decisions that must not be
silently undone, and what is still open.**

## State at handoff

`main` is clean, pushed and deployed to `redmine.inctime.com` at `8fc89e0`
(rollback `1a0c26e`; before the theme-ideas work `03f210b`). No open branches, issues or PRs.

Later on 2026-11-12, ideas from three other themes (plan approved by the user; each a
separate commit), deployed in two batches: steps 1–4 (`1a0c26e`), then step 5, docs and
the dashboard text fix (`8fc89e0`).

| Commit | What |
|---|---|
| `8fc89e0` | Core gives `.mypage-box` (My page and the dashboard plugin's project overview — production renders the overview as `#my-page.dashboard` with `#block-projectmembers.mypage-box`), `div.tooltip span.tip` and `.text-diff` a fixed `#505050` text; dark mode only recoloured their backgrounds, so "Manager:" in Members was dark grey on a dark card (Dracula report). Now `--c-text` on themed surfaces, ≥7:1 everywhere |
| `c3f049f` | Docs: README features/credits, Gantt & Calendar section, all README screenshots regenerated (`src/screenshots.mjs` has `PLAN_PROJECT`/`PLAN_MONTH`), CLAUDE.md sizes + `initSidebarFit`/`initGantt` |
| `5e968df` | Gantt + calendar adapted from **redmine-shadcn-theme (MIT, © 2026 Techolve)** — CSS translated from Tailwind to our tokens; `initGantt()` re-spaces rows 20→28px (rewrites inline `top`, `data-collapse-expand` `top_increment`, container heights; `jQuery.removeData` because jQuery caches `data-*`), stretches a narrow timeline to the card and redraws relations via core `drawGanttHandler()`, again on area resize. Calendar chip links keep the text colour (chip colour as text missed AA). Old dark-only `.cal`/`.gantt_hdr` rules removed; the grouped `html[data-scheme]` ones stay and are outranked by `#content` |
| `7b6ee71` | Syntax colours from the palette: `--c-syn-*` tokens, every Rouge span starts as plain text, 7 groups coloured; AA 4.5 on `--c-surface-2` in Modern + 27 schemes |
| `073c955` | Tracker dot (`--c-trk-1..6`, cycled over `tracker-1…24`) in lists and before the issue title. **Idea from Opale (AGPL) — no code copied.** A tint behind `#id` was dropped (text < 4.5:1 in light schemes) |
| `d4ddd65` | Priority arrows as CSS masks (`--rm-icon-*`, `--c-prio-*`, ≥3:1). Old `.priority-low/-urgent…` rules deleted — they never matched (`priority-<position_name>`: highest, high2, default, low2, lowest…). **Idea from Opale** |
| `2cab8db` | Desktop gradient top bar + rounded project tab bar (`--c-topbar-grad-*`, `--c-menu-grad-*`); header +8px bottom padding, `adjustLayout()` re-measures. **Idea from gitmike (GPL) — no code copied** |

Licences: this theme is MIT. Opale (AGPL-3.0) and gitmike (GPL-2.0) may inspire but never
supply code; shadcn (MIT) code may be adapted with the attribution kept (CSS/JS comments,
README "Built with").

Previewing on production without affecting others: `redmine_user_specific_theme` lets a
user pick a theme in My account. Copy the commit into a new folder
(`git archive <sha> stylesheets javascripts | ssh … tar -x -C themes/redmine-modern-theme-preview`),
restart, the user selects "Redmine modern theme preview". Delete the folder afterwards —
the plugin falls back to `Setting.ui_theme` when a user's theme is missing.

Local test data added: three `blocks` relations in project `turcotte9` (issues 80→10,
56→39, 38→43) for the Gantt relation lines; README Gantt/calendar shots use
`turcotte9`, January/February 2025.

Earlier on 2026-11-12, newest first (every commit deployed on its own after a control run):

| Commit | What |
|---|---|
| `03f210b` | Header: a top-level project has no `.breadcrumbs`, so its name sat in the empty second row of the h1 grid, ~9px below the badge's middle. `#header h1:not(:has(> .breadcrumbs)) > .current-project` spans both rows |
| `392503f` | Vault: `#keys_table th, td { text-align: left }`. The centring is core's `table.list td { text-align: center }`, not the plugin's |
| `44fd47a` | Project board (`/projects` cards): CSS grid `repeat(auto-fill, minmax(min(100%, 340px), 1fr))` instead of core's CSS columns, rows stretched to one height, rounded themed cards, descriptions clamped (3 lines root, 2 child), subprojects as a list with thin dividers. See "Decisions" |
| `7515c77` | Issue edit: Log time's `.splitcontentleft/right` were cards nested in the fieldset — flattened (`fieldset#log_time`). Mobile: "Hours" after Spent time inline; RedmineUP Checklists new-item `+` beside its field |
| `b8523d7` | `.tabular input[type=checkbox|radio] { width: auto; justify-self: start }`. Core responsive.css gives every `.tabular input` `width: 100%` on phones (exempts checkboxes, not radios), so bool custom-field radios were 57px wide with their labels pushed out; a lone checkbox (Public, Private, Inherit members, Administrator) was stretched by the `.tabular p` grid on every width and drawn mid-column. Checkboxes are now native size (they looked bigger before because they were stretched) |
| `ea43686` | Mobile issue form: a select followed by `a.icon-only` / `span.icon-only` / `a.assign-to-me-link` keeps it on the same row (`:has()`), "Hours" after Estimated time inline. Desktop: status with help (i) **and** transition warning gets a 4th grid column |
| `b9f9193` | Mobile issue page: `« Previous \| n of m \| Next »` on its own centred row (it floated and squeezed the subject); attribute label/value 2:3 grid instead of core's fixed 170px label |
| `a2dee2f` | Mobile: filter value select + multi-select `+` on one line (`#filters-table .values` — **divs in Redmine 6, not td**); attachments as one block per file; sidebar toggle hover only under `@media (hover: hover)`. All widths: `::selection` uses new token `--c-selection` (accent tint, fallback rgba + color-mix), `caret-color: var(--c-primary)` |
| `4156ef8` | Mobile sidebar toggle → round floating button bottom-left (pair of the dark-mode button), `sidebarToggleArrow()` gives the arrow for the real state, `no-tooltip` class (core jQuery UI tooltip stuck after a tap), collapsed-sidebar rules scoped to `min-width: 900px` (a sidebar collapsed on desktop opened empty on phones). README "Mobile" section + 5 screenshots; `src/screenshots.mjs` has `ONLY=mobile` |

Earlier, not recorded here before (2026-11-05 … 11-10): `a940137` sticky sidebar works
(`#wrapper { overflow: clip }` on desktop — core's `overflow: hidden` made `#wrapper` the
scroll container) + View Customize pages + dark `.syntaxhl` fallback; `a25375b` dark
pagination / date-picker icon; `9f23d04` issue attribute cards equal height (#14);
`06b6f9d` one scrollbar for a tall sidebar (`fitSidebar`, `.rm-sidebar-tall`, #13);
`44f2100` time entry form; `7e50930` clear-query × (#12); `c1f5dda` sidebar left/right
option (#11); `1f8197e` select chevron on every select. Release `v1.0.0` is on `45537ec`.

GitHub: no open issues or PRs. PR #15 (matbott, 35 commits, Spanish comments, features
for his own setup) was closed with a request for small focused PRs.

Working tree has one untracked file, `Screenshot From 2026-09-02 15-51-15.png`, in the
repo root. It is the user's, not build output — leave it alone unless asked.

The local Redmine dev server may still be running on `http://127.0.0.1:3000`
(`admin` / `admin1234`). `pkill -f puma` stops it; `CLAUDE.md` has the start command.

## Verifying a visual change — read this before you measure anything

This is the part that is easy to get wrong, and getting it wrong produces confident
but false conclusions.

### 0. Use a current Chrome, not the one bundled with the borrowed puppeteer

The borrowed `node_modules` (below) is an old puppeteer whose bundled browser is
**Chromium 80** (2019). It has no `color-mix()` (Chrome 111+), so every
`@supports (color: color-mix(...))` block in `application.css` is skipped and you
measure the static fallbacks, not what users see. Everything measured before
2026-10-29 — including the reference numbers that used to be here — was Chromium 80.
Point the old puppeteer at a current Chrome; its API works with it:

```js
puppeteer.launch({ executablePath:
  '/home/acop/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome', ... })
```

Chromium 80 is still useful for one thing: checking the no-`color-mix()` fallback.

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
  executablePath: '/home/acop/.cache/puppeteer/chrome/linux-147.0.7727.57/chrome-linux64/chrome',
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

Reference numbers on `4d5a4e2`, Chrome 147 under xvfb (`W=1440`, sidebar expanded):

```
my-page      autoscroll #2: overflow 99,  bar 15
issues       overflow 192, bar 15
admin-users  overflow 99,  bar 15
time         overflow 0
projects / issue-detail / project-settings / issue-edit / time_entries/new: no .autoscroll
mobile (W=390): bodyOverflow 0 — tables scroll inside their own wrapper
```

(Chromium 80 gave 90 / 194 / 100 with a 12px bar — compare like with like.)

To reproduce the wide-list case the last change addressed:

```
/issues?set_filter=1&f[]=parent_id&op[parent_id]=~&v[parent_id][]=2
  &f[]=status_id&op[status_id]=o
  &c[]=project&c[]=tracker&c[]=subject&c[]=parent.subject
  &c[]=priority&c[]=status&c[]=assigned_to&c[]=updated_on
```

## Decisions that must not be silently reverted

- **`/issues` scrolling horizontally by ~192px at 1440px is intentional**, not a bug.
  It is the accepted cost of `table.list td.subject { white-space: nowrap }`, which
  took rows on wide lists from 149px to 61px. The user was shown both measured
  options and chose this one. If you think it should change, ask — do not "fix" it.
- **`.autoscroll` is deliberately not `scrollbar-width: thin`.** That bar is the only
  cue that more columns exist off-screen; the previous complaint was precisely that
  people could not find the horizontal scroll.
- **`div#sticky-issue-header` is Redmine core**, not theme code — see `CLAUDE.md`.
- **Project board is a grid, not core's CSS columns.** Columns read top to bottom per
  column (alphabetical order looked shuffled) and left the last column empty with a few
  tall cards. Rows are stretched to one height on purpose (empty space inside cards, not
  between them). Descriptions are clamped; the full text is on the project page.
- **Sticky sidebar relies on `#wrapper { overflow: clip }` (desktop only).** Putting
  `hidden` back silently breaks sticky again. A sidebar taller than the viewport switches
  to `.rm-sidebar-tall` (scrolls with the page, one scrollbar) — #13.
- **Mobile sidebar toggle is bottom-left and round** (user's choice over "in the top
  bar"). The desktop collapsed state does not apply on phones.
- **Checkboxes/radios in `.tabular` are native size, left.** Do not reintroduce a width
  on them; the old big centred checkbox was a stretched input, not a design.

## Known, pre-existing, not regressions

- `my page` and `admin/users` overflow by ~99px at 1440px (Chrome 147). Both did so
  before any of the table work. Untouched.
- The textarea resize grip on `/projects/1/settings` renders differently between two
  Chromium 80 captures of the same CSS. Screenshot noise, not a change.
- Redmine core throws two JS errors on issue pages, unrelated to the theme:
  `Failed to resolve module specifier "application"` and an invalid selector in
  `setupCopyButtonsToPreElements` (`.wiki pre:not(.pre-wrapper pre)`). Ignore them.
- `max-width` on a `td` is a hint, not a rule — CSS table layout may exceed it.
  Observed: `td.subject` renders 393px wide on My page despite `max-width: 320px`.
  Do not treat that as a bug.

## Open items

1. **Production (`redmine.inctime.com`) — resolved, facts below.** The clipped-table
   screenshot was most likely the separate `redmine-modern-theme-dev` copy (see below).

2. **Local test fixture was modified.** Issue #2 in `redmine_development` had its
   subject changed to `Email Program Remediation Plan: Template Rebuild, Sending
   Infrastructure, List Warm-Up & Launch Gate` to reproduce the long-parent-subject
   case. It was `Synergized multimedia hardware`. Useful as a fixture; revert if the
   user wants the seed data pristine.
3. **Screenshots: `src/screenshots.mjs`** (2026-10-29) regenerates every README image
   against the local Redmine (Chrome 147, 1440×900). Do not point it at production —
   real names and data. It needs the local fixtures below and a puppeteer
   `node_modules` symlink in `src/` (git-ignored).
4. `td.description` and `td.last_notes` were left alone. A rule for them was written
   and then dropped: those columns did not render from the URL params tried, so the
   rule could not be verified. Do not ship it unverified.
5. **Colour schemes — merged to `main` (`9da1f48`) and deployed 2026-10-29.** The user
   asked for selectable palettes from Gogh (github.com/Gogh-Co/Gogh, MIT/Apache, 1000
   terminal schemes). The prototype adds a "Colour scheme" section to the account menu
   with Dracula, Nord, Solarized Light: each scheme sets eight raw `--s-*` values, one
   block (section 2b) derives all `--c-*` tokens via `color-mix()`; new
   `--c-on-primary` token replaces hardcoded white on primary backgrounds. Modern
   light/dark is pixel-identical to `main` on 16 pages.
   SVG icons go through a new `--c-icon` token (Modern value = core's `#116699`, so no
   pixel change; schemes = accent). Redmine core greys (`#d0d7de`, `#ddd`, `#eee`,
   `#f7f7f7`, `#888`, `#666`, `#9DB9D5`, `#628DB6` …) are remapped only under
   `html[data-scheme]` at the end of `application.css` — deliberately not at source, so
   Modern stays identical. A colour scan of 16 pages per scheme finds only intended
   colours left (avatars, native checkboxes, overdue red, topbar text).
   **27 schemes** now come from `src/gen-schemes.py` (see CLAUDE.md). It pulls a
   failing accent / red / foreground towards white or black until WCAG AA passes, fits a
   per-scheme `--s-muted`, picks `--s-on-accent`, and drops what it cannot fix without
   changing the scheme (Material Palenight, Solarized Dark). Measured in the browser:
   all 27 pass AA — lowest label 4.68, link 4.71, button text 4.99. Gogh's "One Dark"
   has a grey foreground; the script uses "One Dark Pro" instead.
   UI (user's choice): full card picker on `/my/account` under Preferences, the four
   most recently used as dots in the account menu. Storage is `localStorage` only —
   the JSON API ignores the session cookie, so a theme cannot read a per-user setting
   without a plugin. Cards are `<button>`s: core's `button { height: 24px }` had
   collapsed them until `height: auto` was added.
   **Any Gogh palette (merged, deployed `aef7b64`):** My account also has a search over
   all 1,251 Gogh palettes (`stylesheets/gogh/palettes.json`, fetched only on the first
   keystroke; its digested URL comes from `--rm-gogh-palettes` in CSS). The pick is
   built in the browser by `buildGoghScheme` and stored as `rm-scheme=gogh` +
   `rm-scheme-gogh` (computed `--s-*`), which the early IIFE sets inline on `<html>`.
   Six accent dots (blue, cyan, magenta, green, yellow, red). Verified: JS output equals
   the generator for all 27; all 1,251 palettes × 6 accents reach the targets
   computationally; a 44-palette sample (incl. Solarized Dark, Nep) passes AA rendered.
   `tools/` moved to `src/` because Redmine publishes every other theme directory.

6. **More local fixtures:** issue custom field id 1, "Platforms" (list, multiple, check-box
   style, values Web/iOS/Android/Desktop, all trackers/projects) so `.check_box_group`
   renders on `/issues/21/edit`; three News items in project `schimmel13` for the README
   news screenshot. Delete them if pristine seed data is wanted.

7. **Still open (none requested yet):** light-mode pagination has the same double border
   / core blue current page that dark mode had; the plugin-macro (puzzle) icon is dark in
   dark mode; the redmine.org Theme_List entry is the user's to submit (text was given).
   Gantt on production: relation lines after collapsing/expanding a branch were only
   verified locally (three test relations) — check on a real project if anyone reports
   misplaced arrows.
8. **`redmine.nsinfo.co.rs`** (JKP Informatika) runs this theme too, but we have no
   access. It is updated by the user / another AI instance with `git pull` + restart.
   It has a temporary View Customize rule #1 (`/keys`, CSS) doing what `392503f` now
   does — to be deleted there once the theme is pulled.

## Testing without the plugins installed locally

Local Redmine has no plugins. For plugin pages (Vault, RedmineUP Checklists, View
Customize, custom-field radios, status help/warning icons) the tests inject the plugin's
real markup — copied from the plugin's views or read from production — into a local page,
plus the plugin CSS where it matters, and measure that. Say so when reporting.

Reading production markup: the user is logged in to `redmine.inctime.com` in their own
Chrome; with their permission the Claude-in-Chrome extension can open a page and read
DOM/computed styles (`javascript_tool`). Read only — never click Save, never open the
Vault key table, close the tab afterwards. Do not resize the user's window.

Phone checks: `setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })`
and `page.tap()` instead of `click()` — a mouse click leaves `:hover` and Redmine's jQuery
UI tooltips on screen and makes screenshots lie.

## Production — redmine.inctime.com

- Host `15.204.154.156`. SSH `ubuntu@redmine.inctime.com` (key auth, passwordless sudo),
  then work as `sudo -u redmine -i`. Rails needs a login shell for rvm:
  `sudo -u redmine -i bash -l -s <<'EOF' … EOF` (quoting through ssh+sudo breaks otherwise).
- Redmine 6.1.0 in `/home/redmine/redmine`, `RAILS_ENV=production`, Apache → puma socket
  `/run/redmine/puma.sock`, service `redmine.service`. A second, unrelated instance runs as
  `support` (`support-redmine.service`) — leave it alone.
- `bin/rails runner` as `redmine` fails (`gitolite-rugged` bundler path). Use the
  service's wrapper: `RAILS_ENV=production /home/redmine/.rvm/wrappers/ruby-3.3.5@redmine/bundle exec rails runner file.rb`.
- View Customize (2026-11-10): 5 rules, all JavaScript for `/issues/new` (auto-select
  issue template / tracker per project). None styles anything; nothing to adapt.
- Theme: `themes/redmine-modern-theme` is a git clone of this repo on `main`.
  `themes/redmine-modern-theme-dev` is a plain copy (not git), used by one user.
- Apache serves `/assets/` from `public/`, i.e. **precompiled** assets.
  `config.assets.redmine_detect_update = true` recompiles on boot, so a deploy is:
  `git -C ~/redmine/themes/redmine-modern-theme pull --ff-only` then
  `sudo systemctl restart redmine` (login returns 200 again after ~8–15 s), then check
  the login page links a new `application-*.css` and that file contains the new rule.
  Rollback: `git checkout <previous sha>` + restart.
- Plugin `redmine_user_specific_theme`: users pick a theme per account. Since
  2026-10-29 the global default (`Setting.ui_theme`) is `redmine-modern-theme`
  (was `""`). Revert: `bin/rails runner 'Setting.ui_theme = ""'`.
- Other plugins whose pages were audited light + dark: Agile (board, backlog),
  Redmineflux Testcase, DMSF, Vault (`/keys`, not opened — passwords), Contacts.
  Not theme issues: `/helpdesk_tickets` returns an empty 200, `/contacts` throws
  `observe_field is not a function` (plugin vs Redmine 6.1).
- Logging in for checks: credentials in the repo's `.env` (`PROD_USER`, `PROD_PW`,
  git-ignored); the account has TOTP 2FA, so the user has to type a code. Read-only
  audits only — never submit forms there.

## Mistakes made, and the rules from them

- **Declared `#sticky-issue-header` dead code and deleted 61 lines of working CSS.**
  The grep was scoped to this repo only; the element comes from Redmine core. It was
  caught by a browser check showing the element present, and fully reverted.
  → Before deleting a rule, grep `~/rubydev/redmine6/app` for the selector, and
  confirm in a live page that no element matches.
- **Added a `min-width` that regressed a page nobody asked about.** Caught only by
  the control run described above.
  → Never report a visual fix without before/after numbers from the same script.
- **Measured on Chromium 80 for a whole session without noticing.** The borrowed
  puppeteer's bundled browser ignores every `color-mix()` block. Caught only when a
  new feature gated on `color-mix()` silently did not appear.
  → Check `await browser.version()` once per session; see section 0 above.
- **(2026-11-12) Wrote `#filters-table td.values` for Redmine 6.** The filters are
  `div`s now; the rule matched nothing and the first "after" screenshot looked unchanged.
  → Read the live DOM (or the view) before writing a selector, then confirm the
  computed value changed.
- **(2026-11-12) The tall-sidebar test (`fit.mjs`) fails intermittently, with and
  without changes.** A focused probe (same injection, 24 page loads, left/right, light/
  dark) saw `.rm-sidebar-tall` applied every time within ~50 ms, so the flakiness is in
  the test harness, not the theme. → Rerun; if it fails, run it on the control too
  before blaming a change.
