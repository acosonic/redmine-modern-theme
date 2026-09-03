# Modern Redmine Theme — project context

Drop-in UI theme for **Redmine 6** (dark mode, collapsible sidebar, design tokens).
Repo: `https://github.com/acosonic/redmine-modern-theme` — branch `main`.

**Before making a visual change, read [HANDOFF.md](HANDOFF.md).** It carries what this
file does not: how to measure a layout change so the result is trustworthy (headless
Chrome cannot see scrollbars — use xvfb), deliberate trade-offs that must not be
reverted by accident, and what is still open.

Only two source files ship behaviour:

| File | Notes |
|---|---|
| `stylesheets/application.css` | ~2750 lines. Replaces Redmine's `application.css`; first line imports the Redmine default, everything after is override. |
| `javascripts/theme.js` | ~460 lines vanilla JS, no deps. Auto-loaded into `<head>` by Redmine's `heads_for_theme`. |
| `stylesheets/fonts/*.woff2` | Self-hosted Inter (400/500/600/700 × latin/latin-ext/cyrillic/cyrillic-ext). No Google Fonts CDN — GDPR. |

`screenshots/` feeds the README tables only.

## Local test setup (verified working)

Local Redmine 6 lives at **`~/rubydev/redmine6`**, and `themes/modern-redmine-theme`
there is a **symlink to this repo** — so edits here are live, no copying.

```
~/rubydev/redmine6/themes/modern-redmine-theme -> /home/acop/rubydev/modern-redmine-theme
```

Start the server:

```bash
cd ~/rubydev/redmine6
bash -l -c 'rvm use 3.3.5 && bundle exec rails server -b 127.0.0.1 -p 3000'
```

- Ruby **3.3.5** via rvm (`bash -l -c` is required — rvm is a login-shell function).
- Rails 7.2.2.2, **development** env, MySQL db **`redmine_development`** (`root` / `root`).
- Seed data: 30 projects, 95 issues, 20 users.
- Login: **`admin` / `admin1234`**. Active theme is already set (`Setting.ui_theme = modern-redmine-theme`).
- Logs: `~/rubydev/redmine6/log/development.log`. Stop with `pkill -f puma`.

### Asset pipeline gotchas (Propshaft)

Redmine 6 serves theme files through Propshaft, not statically:

- CSS is served at `/assets/themes/modern-redmine-theme/application-<digest>.css`.
- Propshaft **rewrites relative `url()`** — `url('fonts/inter-400-latin.woff2')` in source
  becomes `/assets/themes/modern-redmine-theme/fonts/inter-400-latin-<digest>.woff2`. Keep
  font refs relative; do not hand-write `/assets/...` paths.
- Theme asset paths are registered **at boot** (`config/initializers/30-redmine.rb` →
  `Redmine::Themes`). **Adding a new file or directory requires a server restart**;
  editing existing files does not.
- CSS edits still need a hard reload (digest changes, but browser caches the old link).

### Screenshots (Puppeteer)

Puppeteer is not installed in this repo. Chrome is cached at `~/.cache/puppeteer`;
borrow an existing install by symlinking its `node_modules` next to the script:

```bash
ln -sfn /home/acop/scrapers/jordan-scrapes-secretary-of-states/node_modules ./node_modules
node shot.mjs   # must be an .mjs in the same dir; NODE_PATH does NOT work for ESM
```

Script pattern: goto `/login`, type into `#username` / `#password`, click
`input[type=submit]`, wait for navigation, then navigate and `page.screenshot`.
README screenshots are 1440×900; theme is tested at 1280 and 1440.

## Code conventions

- **Colours only via tokens.** 74 custom properties in `:root` (line ~170); dark
  overrides in `html.dark-mode { }` (line ~242). No hardcoded hex outside those two blocks.
- A `color-mix()` block (~line 229) derives hover/light/ring shades from `--c-primary`,
  with static fallbacks above it for older browsers. Changing the accent = changing
  `--c-primary` + `--c-topbar-bg`.
- `!important` is used pervasively and deliberately — Redmine's default CSS is imported
  first and is very specific. Match the surrounding style rather than fighting it.
- Mobile breakpoint is **`max-width: 899px`** (two blocks, ~line 1871 and ~2045).
- `theme.js`: the synchronous dark-mode init IIFE at the very top must stay first —
  it runs before paint to avoid a flash of light mode. Everything else initialises
  from `init()` on `DOMContentLoaded`.
- JS features are one function each, all called from `init()`: `initSidebar`,
  `initDarkMode`, `initCollapsible`, `highlightNav`, `initHamburger`, `initProjectBadge`,
  `initSearchWidget`, `initAccountDropdown`, `watchSidebar`. Toasts are exposed as the
  global `window.rmToast(message, type, duration)`.
- JS-injected elements are namespaced `rm-*` (`rm-sidebar`, `rm-toast`, `rm-account-panel`, …).
- **Not everything styled here comes from `theme.js`.** `div#sticky-issue-header`
  (~line 2030) is a **Redmine 6 core** element — rendered by
  `app/views/issues/show.html.erb` and toggled by the Stimulus controller
  `app/javascript/controllers/sticky_issue_header_controller.js`. The theme only
  restyles it to match the topbar, plus resets Redmine `responsive.css`'s
  `top: 64px` (that offset is for the project-jump flyout, which this theme hides).
  Before deleting any rule that `theme.js` does not create, check Redmine's views and
  Stimulus controllers — grep `~/rubydev/redmine6/app` first.
- Redmine re-renders parts of the page over AJAX — section wrapping/collapsible code has
  to be AJAX-safe (re-runnable, idempotent).

## Testing checklist before committing

1. Light **and** dark mode.
2. 1280px, 1440px, and mobile (<899px).
3. Pages that historically broke: issue detail/edit, watchers modal, admin
   roles/permissions (tabular checkboxes), project settings, activity filters, wiki
   `.jstTabs` toolbar.
4. Never modify Redmine core files — only these two source files.
