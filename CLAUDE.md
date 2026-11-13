# Modern Redmine Theme — project context (branch `redmine-7`)

UI theme for **Redmine 7**, written from scratch on 2026-11-12. The Redmine 6 theme lives
on `main` and is maintained separately — do not merge between them; port ideas by hand.
Repo: `https://github.com/acosonic/redmine-modern-theme`.

**Before making a visual change, read [HANDOFF.md](HANDOFF.md)** — how to verify, decisions
that must not be undone by accident, and what is still open.

## Files

| File | Notes |
|---|---|
| `stylesheets/application.css` | Imports core into `@layer core`, then tokens → Open Color map → layout → components. Numbered sections. |
| `stylesheets/schemes.css` | Maps `--s-*` scheme inputs onto `--rm-*`; the 27 blocks between the markers are **generated**. |
| `stylesheets/{responsive,dropdown,context_menu,jstoolbar,scm,gantt}.css` | Shims: each replaces the core sheet of the same name and re-imports it into `layer(core)`. `gantt.css` also carries the Gantt palette. |
| `stylesheets/plugins.css` | Plugin patches, imported by `application.css`. Plugin sheets load after the theme and are unlayered, so every block is nested in `:root` to win on specificity. Tokens only. |
| `javascripts/theme.js` | Vanilla JS. Mode, schemes, Gogh search, sidebar side, collapsible sections, toast, badge. |
| `stylesheets/fonts/*.woff2`, `stylesheets/gogh/palettes.json` | Inter; every Gogh palette (generated). |
| `src/` | Dev tools only — Redmine publishes every other top-level folder of a theme. |

## The three ideas everything rests on

1. **Core is in a cascade layer.** `@layer force, core;` then
   `@import url(/application.css) layer(core)`. Unlayered theme rules beat core regardless
   of specificity, so **do not write `!important`**. The exceptions:
   - core rules that are themselves `!important` (43 of them): answer in `@layer force`
     (section 21) — among important declarations the *earlier* layer wins;
   - an inline style from a core view (`.gantt_hdr` background): unlayered `!important`.
2. **Colours come from inputs.** Section 1 holds the inputs (`--rm-bg`, `--rm-fg`,
   `--rm-accent`, `--rm-on-accent`, `--rm-red/green/yellow/blue`, `--rm-topbar`,
   surfaces, borders, `--rm-muted`), written with `light-dark()`. Section 3 re-derives
   core's `--oc-*` scale and `--color-*` variables from them. No hex colour outside
   section 1 and `schemes.css` (data-URI icons excepted — they are masks).
3. **Use what core 7 has.** Account menu = core's Stimulus `dropdown`; phones = core's
   flyout menu (`responsive.js`); sidebar collapse = core's `#sidebar-switch-button`
   (`localStorage['redmine-sidebar-state']`); Gantt = core's Stimulus controllers.

## Traps this design has (each one was hit while writing it)

- **A general theme rule also beats core's *exceptions*.** `.tabular label { … }` silently
  overrode core's `.tabular label.floating { margin: 0 }`; `div.issue { card }` restyled
  every calendar chip. Write selectors as narrow as the thing you mean
  (`div.issue.details`, `label:not(.floating, .block, .inline)`), and wrap generic element
  restyles in `:where()` so component rules still win (see the button rule in section 8).
- **Anything core changes in `responsive.css` must be desktop-scoped here.** Theme rules
  beat core's mobile rules too. Header, tab bar, sidebar and the label column are inside
  `@media (min-width: 900px)`; section 19 only recolours core's mobile layout.
- **`--oc-white` is core's surface *and* its "text on a colour".** It maps to the surface,
  so text on the top bar / accent is set explicitly (`--rm-topbar-fg`, `--rm-on-accent`).
- **`light-dark()` takes colours only.** Icons are CSS masks filled with a token; where a
  background image is unavoidable (select chevron) it is a mid grey that reads on both.
- **Do not change when `.js-flyout-menu-toggle-button` is visible** — core's
  `responsive.js` uses its visibility to decide when to move the menus into the flyout.

## Colour schemes

`src/gen-schemes.py` reads Gogh's `data/themes.json` (download it; not vendored),
contrast-checks every palette and rewrites the text between `@schemes:begin` /
`@schemes:end` in `stylesheets/schemes.css` and `javascripts/theme.js`, plus
`stylesheets/gogh/palettes.json`. Never hand-edit between the markers.

```bash
python3 -I src/gen-schemes.py /path/to/themes.json          # --check = report only
```

`buildGoghScheme` in `theme.js` is a JS port of the generator; keep the two in step.
Storage keys are the same as on the Redmine 6 branch (`rm-dark`, `rm-scheme`,
`rm-scheme-gogh`, `rm-scheme-recent`, `rm-scheme-dark/-light`, `rm-sidebar-side`,
`rm-open-<section>`), so a site upgraded from 6 to 7 keeps every user's choices.
Mode is `html.dark-mode` / `html.light-mode` (sets `color-scheme`); with no stored choice
the early script follows the OS.

## Local setup (verified 2026-11-12)

Redmine 7.0.3 in `/home/aco/posao/redmine7`, this repo is `themes/redmine-modern-theme`.

```bash
cd /home/aco/posao/redmine7
bash -lc 'rvm use ruby-3.4.12@redmine7 && bundle exec rails server -e development -b 127.0.0.1 -p 3000'
```

- Ruby 3.4.12 via rvm, gemset `redmine7` (`bash -lc` — rvm is a login-shell function).
- SQLite: `db/redmine_development.sqlite3` (seeded by `src/seed.rb`: 8 projects, 96 issues,
  10 users) and `db/redmine.sqlite3` (production, empty). Login **`admin` / `admin1234`**.
- Reseed: delete the dev database, `rake db:migrate`, `rake redmine:load_default_data`,
  `rails runner themes/redmine-modern-theme/src/seed.rb` (all with `RAILS_ENV=development`).
- **`public/assets` must not exist in development** — a precompiled manifest there makes
  Propshaft serve stale files and 404 the theme. `rake assets:clobber`, then restart.
- Editing an existing file is live. **A new file or folder needs a server restart**
  (theme paths and the list of theme stylesheets/scripts are read at boot).
- Paths in CSS: core files as `/application.css`, theme files relative
  (`url('fonts/x.woff2')`, `@import url(schemes.css)`) — Propshaft digests both.

## Tools

```bash
cd src && npm install                      # puppeteer-core; uses /usr/bin/google-chrome
node src/shot.mjs OUT name=/path …         # screenshots; see the header of the file for env
LS='{"rm-dark":"1","rm-scheme":"dracula"}' node src/shot.mjs out issue=/issues/3
MOBILE=1 node src/shot.mjs out issues=/issues
PROBE=src/contrast.mjs node src/shot.mjs out issues=/issues     # WCAG failures, worst first
HEADFUL=1 xvfb-run -a --server-args="-screen 0 1600x1000x24" node src/shot.mjs out …
```

Node 18 via nvm (`source ~/.nvm/nvm.sh`). Set the mode with `LS` (`rm-dark` `1`/`0`), not
only with `MODE` — the stored choice wins over the emulated OS preference.

## Testing checklist before committing

1. Light and dark, plus at least one dark and one light scheme.
2. 1280px, 1440px and a phone (`MOBILE=1`); `bodyOverflow` must stay 0 on the phone.
3. `PROBE=src/contrast.mjs` on the pages you touched (avatars are core's and may fail).
4. Pages that historically broke: issue show/edit, watchers dialog, roles/permissions,
   project settings, activity, wiki toolbar, Gantt, calendar.
5. Never modify Redmine core files.
