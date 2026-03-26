# Modern Redmine Theme

A clean, modern UI theme for Redmine 6 with dark mode, collapsible sidebar, and design tokens.

## Features

- Dark / light mode toggle (persisted per browser)
- Collapsible left sidebar (persisted per browser)
- Design tokens — change the entire palette by editing 3 lines
- Inter font, modern card layout, smooth transitions
- Toast notifications, collapsible issue sections
- No backend changes required

## Install

```bash
git clone <repo-url> modern-redmine-theme
cd modern-redmine-theme
bash install.sh /path/to/your/redmine
```

Then restart Redmine:

```bash
cd /path/to/your/redmine
bundle exec rails server
```

## Uninstall

```bash
bash uninstall.sh /path/to/your/redmine
```

Restores the original `base.html.erb` from the backup created during install.

## Customise colours

Open `stylesheets/modern_theme.css` and edit the tokens at the top of `:root`:

```css
--c-primary:       #0891B2;  /* accent colour (light mode) */
--c-primary-hover: #0E7490;
--c-topbar-bg:     #083344;  /* top navigation bar */
```

Dark-mode overrides live in the `html.dark-mode { … }` block directly below.

## Files changed in Redmine

| File | Change |
|------|--------|
| `app/assets/stylesheets/modern_theme.css` | Added (theme stylesheet) |
| `public/javascripts/modern_theme.js` | Added (sidebar, dark mode, toasts) |
| `app/views/layouts/base.html.erb` | Modified (loads Inter font, Tailwind CDN, theme files) |

## Compatibility

Tested on Redmine 6.x with Propshaft asset pipeline.
