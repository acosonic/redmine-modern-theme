# Handoff — Modern Redmine Theme, branch `redmine-7`

Written 2026-11-12. Read `CLAUDE.md` first (architecture, traps, local setup, tools).
This file holds the state, what was verified and how, decisions, and what is open.
The Redmine 6 history (production hosts, plugin audits, earlier decisions) is in
`HANDOFF.md` on `main` — still the reference for the 6.x theme and for the servers.

## State

Branch `redmine-7`, pushed to GitHub on 2026-11-12 and released as the pre-release
`v2.0.0-beta.1` (`main` keeps `v1.x` for Redmine 6). **Not deployed anywhere.** Started from
`main` at `346823f`; the first commit removes the Redmine 6 stylesheet and script.
No production server runs Redmine 7 yet.

Size: `application.css` ~1,670 lines (145 of them font faces), `schemes.css` ~200,
`theme.js` ~860 (most of it the Gogh search and scheme picker, carried over unchanged).
The Redmine 6 theme was 4,352 + 1,238 lines with 2,195 `!important`; this one has 13,
all in `@layer force` plus one for an inline style.

## What is done

| Area | Status |
|---|---|
| Core in `@layer core`, shims for the six replaceable core sheets | done, verified through Propshaft |
| Tokens → Open Color map, light / dark via `light-dark()` | done |
| 27 schemes + any Gogh palette, picker in account menu and on My account | done (blocks copied from `main`; generator retargeted, **not re-run** — no `themes.json` here) |
| Top bar, header, project badge, tab bar, sidebar left/right, sticky bars | done |
| Lists, alignment rule, subject on one line, pagination, query form | done |
| Issue page, attribute cards, history, sticky issue header, progress bar | done |
| Forms, buttons, tabs, flash, wiki text, login | done |
| Projects grid, overview / My page boxes | done |
| Priority arrows, tracker dots, syntax colours | done |
| Context menu, jQuery UI dialog, tooltips, @mention list | done |
| Gantt palette, calendar (core's layout, theme colours) | done |
| Phones: core's header + flyout in theme colours | done, first pass |

## Verified (2026-11-12, Chrome 142, local Redmine 7.0.3)

- Layer import compiles to `@import url("/assets/application-<hash>.css") layer(core)`;
  `@layer force` beats core's `!important` (probe: selected row background and
  `input.autocomplete` padding).
- `src/contrast.mjs` on issues list, issue page and project settings: **Modern light,
  Modern dark and all 27 schemes report no failure** except core's coloured avatars.
  A wider page set (edit, projects, overview, account) was run for Modern and 7 schemes.
- Phone 390×844: `bodyOverflow` 0 on issue list, issue, issue edit; flyout opens.
- Screenshots reviewed by eye: issues, issue, edit, new issue, projects, overview,
  settings, My page, My account, calendar, Gantt, context menu, watchers dialog.

RTL was only simulated (`document.documentElement.dir = 'rtl'` on the issue page: layout
mirrors, no overflow) — not tested with an RTL language set in Redmine.

Not verified: real scrollbar widths under xvfb were run but not measured; printing;
Firefox / Safari; any plugin; the roles/permissions, activity, roadmap, news, wiki, files,
repository, search and admin pages were not looked at individually.

## Decisions carried over from the Redmine 6 theme

- **Issue subjects stay on one line** (`td.subject { white-space: nowrap }`); wide lists
  scroll sideways on purpose. Ask before changing.
- **`.autoscroll` keeps a full-size scrollbar** — it is the only cue that columns continue.
- **Project board is a grid**, not core's CSS columns; descriptions are clamped.
- **Checkboxes and radios in `.tabular` are native size**, at the start of the field column.
- **Sticky bars need `#wrapper { overflow: clip }`** (desktop). `hidden` breaks sticky.
- Licences: this theme is MIT. Opale (AGPL) and gitmike (GPL) may inspire but never supply
  code. The Redmine 6 Gantt/calendar code adapted from redmine-shadcn-theme was **not**
  carried over (core 7 redraws the Gantt itself), so that attribution is gone from the
  README here.

## New decisions on this branch

- **Sidebar collapse and the phone menu are core's.** The round floating sidebar button
  and the theme's own hamburger from the 6.x theme are gone. On phones the sidebar content
  is in core's flyout. The user has not seen this yet — confirm it is acceptable.
- **Dark mode with no stored choice follows the OS** (6.x did too), now also live when the
  OS setting changes.
- **Light accent is `#0C809E`**, slightly darker than 6.x's `#0891B2`, so white text on it
  reaches 4.6:1 (it was 3.68:1).
- **Gantt rows keep core's 20px height.** The 6.x theme re-spaced them to 28px by rewriting
  inline positions in JS; that fights core's Stimulus Gantt and was not ported.
- **Browser floor is 2024** (`@layer`, `light-dark()`, nesting, `:has()`); no fallbacks.

## Open

1. **Stable release** — `v2.0.0` once items 2–5 are done; until then tag betas from
   this branch (`gh release create v2.0.0-beta.N --target redmine-7 --prerelease`).
2. **Pages not yet reviewed** (see "Not verified"). Expect small gaps: roadmap, news,
   activity, wiki history/diff, repository browser (`scm.css` is only a shim), files,
   documents, search results, admin lists, workflow tables, time report.
3. **Plugins** — nothing ported. `stylesheets/plugins.css` from the plan does not exist
   yet. Port a plugin's patch only after that plugin runs on Redmine 7 and its markup has
   been read live (Agile, Checklists, Testcase, DMSF, Vault, View Customize, Additionals,
   inplace editor were covered on 6.x).
4. **Re-run `src/gen-schemes.py`** against Gogh's `themes.json` to confirm it still
   reproduces the copied blocks (output format changed only in indentation).
5. **Selected state of scheme cards / side options** and the Gogh search UI were ported
   mechanically (old `--c-*` tokens renamed); looked at once in dark mode, not polished.
6. **i18n** — every string the theme adds is English ("Colour scheme", "Sidebar
   position", …), as on 6.x.
7. **README screenshots** — twenty, regenerated with `node src/shot.mjs screenshots …`
   (the 6.x README had 43). Regenerate the affected ones after a visible change.
8. Core throws nothing new, but watch the console on issue pages after core upgrades:
   `theme.js` reads core ids (`#account .dropdown-content`, `#pref_comments_sorting`,
   `#issue_tree`, `#relations`, `#sidebar-wrapper`).

## Mistakes made while writing this, and the rule from each

- **A precompiled `public/assets` from the production install made every theme asset
  404 in development.** → `rake assets:clobber` and restart before trusting a 404.
- **New `theme.js` / `schemes.css` did not load until the server was restarted**, and the
  first screenshots silently showed the theme without them. → after adding a file,
  restart, then check the page source lists it.
- **A general rule overrode core's exceptions twice** (floating labels, calendar issues).
  → see "Traps" in `CLAUDE.md`; look at a page that uses the *variant* before moving on.
- **Desktop header rules broke core's phone header.** → anything `responsive.css`
  restyles belongs inside `@media (min-width: 900px)` here.
- **`MODE=dark` alone did not switch the page** once `theme.js` existed — the stored
  choice wins. → drive modes with `LS='{"rm-dark":"1"}'`.
