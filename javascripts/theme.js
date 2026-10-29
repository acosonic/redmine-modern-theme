/* ============================================================
   MODERN REDMINE THEME — theme.js
   Auto-loaded by Redmine's heads_for_theme in <head>.

   IMPORTANT: The early dark-mode block runs SYNCHRONOUSLY so the
   html.dark-mode class is set before the body renders — no flash.
   ============================================================ */

/* ── EARLY DARK MODE (synchronous — must stay at top level) ── */
(function () {
  var stored = localStorage.getItem('rm-dark');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === '1' || (stored === null && prefersDark)) {
    document.documentElement.classList.add('dark-mode');
  }
  // Colour scheme (see initSchemePicker). rm-dark is kept in step with the
  // scheme's variant when one is picked, so the class above already matches.
  var scheme = localStorage.getItem('rm-scheme');
  if (scheme) document.documentElement.setAttribute('data-scheme', scheme);
  // A scheme picked from the full Gogh list carries its own computed --s-* values
  if (scheme === 'gogh') {
    try {
      var vars = JSON.parse(localStorage.getItem('rm-scheme-gogh')).vars;
      for (var k in vars) document.documentElement.style.setProperty(k, vars[k]);
    } catch (e) {}
  }
}());

/* ── REST runs after DOM is ready ──────────────────────────── */
(function () {
  'use strict';

  var qs  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };

  /* ── LAYOUT: measure fixed headers and push #main down ───── */
  function adjustLayout() {
    var topMenu = qs('#top-menu');
    var header  = qs('#header');
    var main    = qs('#main');
    if (!main) return;

    var topH    = topMenu ? topMenu.getBoundingClientRect().height : 44;
    var headerH = header  ? header.getBoundingClientRect().height  : 90;
    var total   = Math.ceil(topH + headerH);

    var root = document.documentElement;
    root.style.setProperty('--topbar-h',  topH    + 'px');
    root.style.setProperty('--header-h',  headerH + 'px');
    root.style.setProperty('--total-top', total   + 'px');
    main.style.marginTop = total + 'px';

    // keep sidebar toggle below the fixed header
    var toggleBtn = qs('#rm-sidebar-toggle');
    if (toggleBtn) toggleBtn.style.top = (total + 16) + 'px';
  }

  // Run once on DOMContentLoaded, again after fonts/images settle
  function scheduleLayoutAdjust() {
    adjustLayout();
    requestAnimationFrame(function () {
      adjustLayout();
      setTimeout(adjustLayout, 300); // catch late-loading elements
    });
  }

  /* ── SIDEBAR TOGGLE ─────────────────────────────────────── */
  function initSidebar() {
    var main    = qs('#main');
    var sidebar = qs('#sidebar');
    if (!main || !sidebar || !main.classList.contains('collapsiblesidebar')) return;

    // Inject button at the top of sidebar-wrapper
    var btn = document.createElement('button');
    btn.id = 'rm-sidebar-toggle';
    btn.setAttribute('aria-label', 'Toggle sidebar');
    btn.title = 'Toggle sidebar';
    btn.textContent = '‹';
    document.body.appendChild(btn); // must be outside sidebar so overflow:hidden can't clip it

    var collapsed = localStorage.getItem('rm-sidebar') === '0';
    if (collapsed) {
      main.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
      btn.textContent = '›';
    }

    btn.addEventListener('click', function () {
      if (window.innerWidth <= 899) {
        // Mobile: overlay mode — toggle body.sidebar-open
        var isOpen = document.body.classList.toggle('sidebar-open');
        btn.textContent = isOpen ? '‹' : '›';
      } else {
        // Desktop: collapse mode
        var isCollapsed = main.classList.toggle('sidebar-collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        btn.textContent = isCollapsed ? '›' : '‹';
        localStorage.setItem('rm-sidebar', isCollapsed ? '0' : '1');
      }
    });

    // Close sidebar on outside tap (mobile)
    document.addEventListener('click', function (e) {
      if (window.innerWidth <= 899 && document.body.classList.contains('sidebar-open')) {
        var sidebar = qs('#sidebar');
        if (sidebar && !sidebar.contains(e.target) && e.target !== btn) {
          document.body.classList.remove('sidebar-open');
          btn.textContent = '›';
        }
      }
    });
  }

  /* ── DARK MODE ───────────────────────────────────────────── */
  function initDarkMode() {
    var isDark = localStorage.getItem('rm-dark') === '1';
    var btn = document.createElement('button');
    btn.id = 'rm-darkmode-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.title = 'Toggle dark mode';
    btn.textContent = isDark ? '☀️' : '🌙';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var nowDark = document.documentElement.classList.toggle('dark-mode');
      btn.textContent = nowDark ? '☀️' : '🌙';
      localStorage.setItem('rm-dark', nowDark ? '1' : '0');
      // A scheme fixes its own variant, so toggling falls back to the default palette
      if (document.documentElement.hasAttribute('data-scheme')) applyScheme('');
      rmToast(nowDark ? 'Dark mode on' : 'Light mode on', 'info', 2000);
    });
  }

  /* ── COLOUR SCHEMES ──────────────────────────────────────── */
  // Palettes live in application.css (section 2b); swatch = [background, text, accent].
  // dark: null keeps whatever light/dark state the user already has.
  // The account menu shows the RECENT_MAX most recently used schemes; the full
  // picker is on My account. Everything is per browser (localStorage), like dark mode.
  var SCHEMES = [
    { id: '', name: 'Modern', dark: null, swatch: ['#F0F4F8', '#0F1923', '#0891B2'] },
    // @schemes:begin — generated by src/gen-schemes.py, do not edit
    { id: 'ayu-dark', name: 'Ayu Dark', dark: true, swatch: ['#0A0E14', '#B3B1AD', '#59C2FF'] },
    { id: 'ayu-mirage', name: 'Ayu Mirage', dark: true, swatch: ['#1F2430', '#CCCAC2', '#6DCBFA'] },
    { id: 'catppuccin-macchiato', name: 'Catppuccin Macchiato', dark: true, swatch: ['#24273A', '#CAD3F5', '#8AADF4'] },
    { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', dark: true, swatch: ['#1E1E2E', '#CDD6F4', '#89B4FA'] },
    { id: 'dracula', name: 'Dracula', dark: true, swatch: ['#282A36', '#F8F8F2', '#C098F9'] },
    { id: 'everforest-dark', name: 'Everforest Dark', dark: true, swatch: ['#2D353B', '#E5DDCC', '#85BEB7'] },
    { id: 'github-dark', name: 'GitHub Dark', dark: true, swatch: ['#101216', '#A8AFB6', '#6CA4F8'] },
    { id: 'github-dark-dimmed', name: 'GitHub Dark Dimmed', dark: true, swatch: ['#22272E', '#BDC8D2', '#64A5F6'] },
    { id: 'gruvbox-dark', name: 'Gruvbox Dark', dark: true, swatch: ['#282828', '#EBDBB2', '#D79921'] },
    { id: 'kanagawa-wave', name: 'Kanagawa Wave', dark: true, swatch: ['#1F1F28', '#DCD7BA', '#7E9CD8'] },
    { id: 'material-ocean', name: 'Material Ocean', dark: true, swatch: ['#0F111A', '#ABAEB9', '#82AAFF'] },
    { id: 'monokai-pro', name: 'Monokai Pro', dark: true, swatch: ['#2D2A2E', '#FCFCFA', '#FC9867'] },
    { id: 'nord', name: 'Nord', dark: true, swatch: ['#2E3440', '#D8DEE9', '#88C0D0'] },
    { id: 'one-dark', name: 'One Dark', dark: true, swatch: ['#282C34', '#CDD1D9', '#61AFEF'] },
    { id: 'ros-pine', name: 'Rosé Pine', dark: true, swatch: ['#191724', '#E0DEF4', '#C4A7E7'] },
    { id: 'ros-pine-moon', name: 'Rosé Pine Moon', dark: true, swatch: ['#232136', '#E0DEF4', '#C4A7E7'] },
    { id: 'tokyo-night', name: 'Tokyo Night', dark: true, swatch: ['#1A1B26', '#C0CAF5', '#7AA2F7'] },
    { id: 'ayu-light', name: 'Ayu Light', dark: false, swatch: ['#F8F9FA', '#4E5257', '#2573A9'] },
    { id: 'catppuccin-latte', name: 'Catppuccin Latte', dark: false, swatch: ['#EFF1F5', '#4C4F69', '#1C61E9'] },
    { id: 'everforest-light', name: 'Everforest Light', dark: false, swatch: ['#FDF6E3', '#4A555B', '#2E769E'] },
    { id: 'github-light', name: 'GitHub Light', dark: false, swatch: ['#FFFFFF', '#1F2328', '#0969DA'] },
    { id: 'gruvbox-light', name: 'Gruvbox Light', dark: false, swatch: ['#FBF1C7', '#3C3836', '#3B7174'] },
    { id: 'kanagawa-lotus', name: 'Kanagawa Lotus', dark: false, swatch: ['#F2ECBC', '#4C4C5A', '#4D699B'] },
    { id: 'one-light', name: 'One Light', dark: false, swatch: ['#F8F8F8', '#2A2B32', '#315EEE'] },
    { id: 'ros-pine-dawn', name: 'Rosé Pine Dawn', dark: false, swatch: ['#FAF4ED', '#534E73', '#7A6890'] },
    { id: 'solarized-light', name: 'Solarized Light', dark: false, swatch: ['#FCF4DC', '#42535A', '#1F70BD'] },
    { id: 'tokyo-night-day', name: 'Tokyo Night Day', dark: false, swatch: ['#E1E2E7', '#264386', '#225EAF'] },
    // @schemes:end
  ];
  var RECENT_MAX = 4;
  var RECENT_DEFAULT = ['', 'dracula', 'nord', 'github-light'];

  // Any of Gogh's ~1250 palettes, picked on My account. Its --s-* values are computed
  // in the browser (buildGoghScheme) and set inline on <html>; only one at a time.
  var GOGH_ID = 'gogh';
  var S_VARS = ['--s-bg', '--s-fg', '--s-muted', '--s-accent', '--s-on-accent',
                '--s-red', '--s-green', '--s-yellow', '--s-blue'];

  function goghScheme() {
    var g = null;
    try { g = JSON.parse(localStorage.getItem('rm-scheme-gogh')); } catch (e) {}
    return g && g.vars ? { id: GOGH_ID, name: g.name, dark: g.dark, swatch: g.swatch, gogh: g } : null;
  }

  function findScheme(id) {
    if (id === GOGH_ID) return goghScheme();
    return SCHEMES.filter(function (s) { return s.id === id; })[0];
  }

  function schemesSupported() {
    return !!(window.CSS && CSS.supports('color', 'color-mix(in srgb, red, white)'));
  }

  function currentSchemeId() {
    return document.documentElement.getAttribute('data-scheme') || '';
  }

  function recentSchemeIds() {
    var ids = null;
    try { ids = JSON.parse(localStorage.getItem('rm-scheme-recent')); } catch (e) {}
    if (!Array.isArray(ids)) ids = RECENT_DEFAULT;
    // Current first, then history, then defaults to fill up — known ids only
    var out = [];
    [currentSchemeId()].concat(ids, RECENT_DEFAULT).forEach(function (id) {
      if (out.length < RECENT_MAX && out.indexOf(id) === -1 && findScheme(id)) out.push(id);
    });
    return out;
  }

  function rememberScheme(id) {
    var ids = [id].concat(recentSchemeIds().filter(function (x) { return x !== id; }));
    try { localStorage.setItem('rm-scheme-recent', JSON.stringify(ids.slice(0, RECENT_MAX))); } catch (e) {}
  }

  function applyScheme(id) {
    var root = document.documentElement;
    var scheme = findScheme(id) || SCHEMES[0];
    S_VARS.forEach(function (k) { root.style.removeProperty(k); });
    if (scheme.gogh) {
      Object.keys(scheme.gogh.vars).forEach(function (k) { root.style.setProperty(k, scheme.gogh.vars[k]); });
    }
    if (scheme.id) {
      root.setAttribute('data-scheme', scheme.id);
      localStorage.setItem('rm-scheme', scheme.id);
    } else {
      root.removeAttribute('data-scheme');
      localStorage.removeItem('rm-scheme');
    }
    if (scheme.dark !== null) {
      root.classList.toggle('dark-mode', scheme.dark);
      localStorage.setItem('rm-dark', scheme.dark ? '1' : '0');
      var toggle = qs('#rm-darkmode-toggle');
      if (toggle) toggle.textContent = scheme.dark ? '☀️' : '🌙';
    }
    rememberScheme(scheme.id);
    qsa('.rm-scheme-recent').forEach(renderRecentSchemes);
    qsa('[data-scheme-id]').forEach(function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-scheme-id') === scheme.id ? 'true' : 'false');
    });
    qsa('.rm-gogh-current').forEach(renderGoghCurrent);
    qsa('.rm-gogh-results [data-gogh-name]').forEach(function (b) {
      b.setAttribute('aria-checked', scheme.gogh && scheme.gogh.name === b.getAttribute('data-gogh-name') ? 'true' : 'false');
    });
  }

  /* Gogh palette → --s-* values. Mirrors src/gen-schemes.py (same surfaces as CSS
     section 2b, same WCAG targets, same nudging) except that nothing is dropped:
     a low-contrast palette is pulled further and the user is told. */
  var WHITE = [1, 1, 1], BLACK = [0, 0, 0];
  var ACCENT_SLOTS = [[5, 'Blue'], [7, 'Cyan'], [6, 'Magenta'], [3, 'Green'], [4, 'Yellow'], [2, 'Red']];

  function hexRgb(h) {
    return [0, 2, 4].map(function (i) { return parseInt(h.replace('#', '').substr(i, 2), 16) / 255; });
  }
  function rgbHex(c) {
    return '#' + c.map(function (v) {
      var n = Math.round(Math.max(0, Math.min(1, v)) * 255);
      return (n < 16 ? '0' : '') + n.toString(16).toUpperCase();
    }).join('');
  }
  function mixRgb(a, b, pa) { return a.map(function (x, i) { return x * pa + b[i] * (1 - pa); }); }
  function luminance(c) {
    var l = c.map(function (v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function contrast(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function worstContrast(c, bgs) {
    return Math.min.apply(null, bgs.map(function (b) { return contrast(c, b); }));
  }

  // row = [name, dark, background, foreground, color_01 … color_08] from gogh/palettes.json
  function buildGoghScheme(row, accentSlot) {
    var dark = !!row[1], bg0 = hexRgb(row[2]), bg = bg0, fg0 = hexRgb(row[3]);
    var toward = dark ? WHITE : BLACK, adjusted = [];
    var slot = function (n) { return hexRgb(row[3 + n]); };
    var backgrounds = function (fg) {   // --c-bg, --c-surface, --c-surface-2
      return dark ? [bg, mixRgb(fg, bg, 0.06), mixRgb(fg, bg, 0.10)]
                  : [bg, mixRgb(WHITE, bg, 0.65), mixRgb(WHITE, bg, 0.35)];
    };
    var nudge = function (c0, bgs) {     // 5% steps towards white/black until AA
      for (var st = 0; st <= 100; st += 5) {
        var c = mixRgb(toward, c0, st / 100);
        if (worstContrast(c, bgs) >= 4.5 || st === 100) return { c: c, step: st };
      }
    };
    // Text first; only if even pure white/black text cannot reach 7:1 (a mid-grey
    // background, e.g. Nep) does the background move too — the generator never needs this
    var fg, bgs, fgStep, bgStep;
    for (bgStep = 0; bgStep <= 100; bgStep += 5) {
      bg = mixRgb(dark ? BLACK : WHITE, bg0, bgStep / 100);
      for (fgStep = 0; fgStep <= 100; fgStep += 5) {
        fg = mixRgb(toward, fg0, fgStep / 100);
        bgs = backgrounds(fg);
        if (worstContrast(fg, bgs) >= 7) break;
      }
      if (worstContrast(fg, bgs) >= 7) break;
    }
    if (bgStep) adjusted.push('background');
    if (fgStep) adjusted.push('text');
    var muted;
    for (var pct = 72; pct <= 100; pct += 2) {
      muted = mixRgb(fg, bg, pct / 100);
      if (worstContrast(muted, bgs) >= 4.5) break;
    }
    var accent = nudge(slot(accentSlot || 5), bgs), red = nudge(slot(2), bgs);
    if (accent.step) adjusted.push('accent');
    if (red.step) adjusted.push('red');
    var cands = dark ? [bg, WHITE, BLACK] : [WHITE, bg, BLACK];
    var on = cands.filter(function (c) { return contrast(c, accent.c) >= 4.5; })[0] ||
             cands.sort(function (a, b) { return contrast(b, accent.c) - contrast(a, accent.c); })[0];
    return {
      name: row[0], dark: dark, accentSlot: accentSlot || 5, row: row,
      adjusted: adjusted, strong: fgStep > 40 || bgStep > 0,
      swatch: [rgbHex(bg), rgbHex(fg), rgbHex(accent.c)],
      vars: {
        '--s-bg': rgbHex(bg), '--s-fg': rgbHex(fg), '--s-muted': rgbHex(muted),
        '--s-accent': rgbHex(accent.c), '--s-on-accent': rgbHex(on), '--s-red': rgbHex(red.c),
        '--s-green': '#' + row[6], '--s-yellow': '#' + row[7], '--s-blue': '#' + row[8]
      }
    };
  }
  window.rmGoghScheme = buildGoghScheme;  // for tests: must match src/gen-schemes.py

  function applyGoghScheme(row, accentSlot) {
    var g = buildGoghScheme(row, accentSlot);
    try { localStorage.setItem('rm-scheme-gogh', JSON.stringify(g)); } catch (e) {}
    applyScheme(GOGH_ID);
  }

  // palettes.json is ~50 KB gzipped, so it is fetched only when someone searches.
  // Its digested URL comes from CSS: Propshaft rewrites url() in --rm-gogh-palettes.
  var goghPalettes = null;
  function loadGoghPalettes() {
    if (goghPalettes) return goghPalettes;
    var m = getComputedStyle(document.documentElement).getPropertyValue('--rm-gogh-palettes')
      .match(/url\(\s*["']?([^"')]+)/);
    goghPalettes = !m ? Promise.reject(new Error('--rm-gogh-palettes not set')) :
      fetch(m[1], { credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (d) { return d.schemes; });
    goghPalettes.catch(function () { goghPalettes = null; }); // let the next search retry
    return goghPalettes;
  }

  function schemeButton(s, className) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.title = s.name;
    b.setAttribute('role', 'radio');
    b.setAttribute('data-scheme-id', s.id);
    b.setAttribute('aria-checked', s.id === currentSchemeId() ? 'true' : 'false');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      applyScheme(s.id);
    });
    return b;
  }

  function renderRecentSchemes(row) {
    row.innerHTML = '';
    recentSchemeIds().forEach(function (id) {
      var s = findScheme(id);
      var dot = schemeButton(s, 'rm-scheme-dot');
      dot.setAttribute('aria-label', s.name);
      dot.style.background = 'linear-gradient(135deg, ' + s.swatch[0] + ' 50%, ' + s.swatch[2] + ' 50%)';
      row.appendChild(dot);
    });
  }

  // Account menu: recent schemes + link to the full picker on My account
  function initSchemePicker() {
    var panel = qs('.rm-account-panel');
    if (!panel || qs('.rm-scheme-recent', panel)) return; // idempotent
    if (!schemesSupported()) return;
    var myAccount = qs('a.my-account', panel);

    var sep = document.createElement('div');
    sep.className = 'rm-account-panel-sep';
    var label = document.createElement('div');
    label.className = 'rm-scheme-label';
    label.textContent = 'Colour scheme';
    var row = document.createElement('div');
    row.className = 'rm-scheme-recent';
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', 'Recent colour schemes');
    renderRecentSchemes(row);

    panel.appendChild(sep);
    panel.appendChild(label);
    panel.appendChild(row);
    if (myAccount) {
      var more = document.createElement('a');
      more.className = 'rm-scheme-more';
      more.href = myAccount.getAttribute('href') + '#rm-schemes';
      more.textContent = 'All colour schemes…';
      panel.appendChild(more);
    }
  }

  function schemePreview(swatch) {
    var pv = document.createElement('span');
    pv.className = 'rm-scheme-preview';
    pv.setAttribute('aria-hidden', 'true');
    pv.style.setProperty('--p-bg', swatch[0]);
    pv.style.setProperty('--p-fg', swatch[1]);
    pv.style.setProperty('--p-accent', swatch[2]);
    pv.innerHTML = '<i></i><i></i><i></i>';
    return pv;
  }

  // Current Gogh pick: its name, an accent chooser and what was changed for contrast
  function renderGoghCurrent(el) {
    el.innerHTML = '';
    var cur = findScheme(currentSchemeId());
    if (!cur || !cur.gogh) { el.hidden = true; return; }
    el.hidden = false;
    var g = cur.gogh;
    var title = document.createElement('div');
    title.className = 'rm-gogh-title';
    title.textContent = g.name;
    el.appendChild(title);
    var row = document.createElement('div');
    row.className = 'rm-scheme-recent rm-gogh-accents';
    row.setAttribute('role', 'radiogroup');
    row.setAttribute('aria-label', 'Accent colour');
    ACCENT_SLOTS.forEach(function (a) {
      var built = buildGoghScheme(g.row, a[0]);
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'rm-scheme-dot';
      dot.title = a[1] + ' accent';
      dot.setAttribute('role', 'radio');
      dot.setAttribute('aria-label', a[1] + ' accent');
      dot.setAttribute('aria-checked', a[0] === g.accentSlot ? 'true' : 'false');
      dot.style.background = built.vars['--s-accent'];
      dot.addEventListener('click', function () { applyGoghScheme(g.row, a[0]); });
      row.appendChild(dot);
    });
    el.appendChild(row);
    // Red is nudged for most palettes and nobody notices; say so only for what shows
    var shown = g.adjusted.filter(function (a) { return a !== 'red'; });
    if (shown.length) {
      var note = document.createElement('p');
      note.className = 'rm-scheme-hint rm-gogh-note';
      note.textContent = (g.strong ? 'This palette has low contrast, so its colours were changed noticeably' :
        'Adjusted for readability') + ' (' + shown.join(', ') + ').';
      el.appendChild(note);
    }
  }

  function goghSearch() {
    var wrap = document.createElement('div');
    wrap.className = 'rm-gogh';
    var head = document.createElement('div');
    head.className = 'rm-scheme-group';
    head.textContent = 'Any Gogh scheme';
    var input = document.createElement('input');
    input.type = 'search';
    input.className = 'rm-gogh-search';
    input.placeholder = 'Search all Gogh schemes by name…';
    input.setAttribute('aria-label', 'Search Gogh colour schemes');
    var status = document.createElement('p');
    status.className = 'rm-scheme-hint rm-gogh-status';
    status.setAttribute('aria-live', 'polite');
    var current = document.createElement('div');
    current.className = 'rm-gogh-current';
    var results = document.createElement('div');
    results.className = 'rm-scheme-grid rm-gogh-results';
    results.setAttribute('role', 'radiogroup');
    results.setAttribute('aria-label', 'Matching Gogh schemes');
    [head, current, input, status, results].forEach(function (n) { wrap.appendChild(n); });
    renderGoghCurrent(current);

    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var q = input.value.trim().toLowerCase();
        if (!q) { results.innerHTML = ''; status.textContent = ''; return; }
        if (!goghPalettes) status.textContent = 'Loading…';
        loadGoghPalettes().then(function (rows) {
          if (input.value.trim().toLowerCase() !== q) return; // a newer search is running
          // Swap the old results out only now, so the list does not flash empty per keystroke
          results.innerHTML = '';
          var hits = rows.filter(function (r) { return r[0].toLowerCase().indexOf(q) !== -1; });
          var cur = goghScheme();
          hits.slice(0, 24).forEach(function (r) {
            var built = buildGoghScheme(r, 5);
            var card = document.createElement('button');
            card.type = 'button';
            card.className = 'rm-scheme-card';
            card.title = r[0] + (r[1] ? ' (dark)' : ' (light)');
            card.setAttribute('role', 'radio');
            card.setAttribute('data-gogh-name', r[0]);
            card.setAttribute('aria-checked', currentSchemeId() === GOGH_ID && cur && cur.name === r[0] ? 'true' : 'false');
            card.appendChild(schemePreview(built.swatch));
            card.appendChild(document.createTextNode(r[0]));
            card.addEventListener('click', function () { applyGoghScheme(r, 5); });
            results.appendChild(card);
          });
          status.textContent = hits.length === 0 ? 'No scheme matches “' + input.value.trim() + '”.' :
            hits.length > 24 ? 'Showing 24 of ' + hits.length + ' matches — type more to narrow it down.' :
            hits.length + (hits.length === 1 ? ' match.' : ' matches.');
        }, function () {
          status.textContent = 'Could not load the Gogh palettes.';
        });
      }, 150);
    });
    return wrap;
  }

  // My account: every scheme as a preview card, next to Redmine's own Preferences
  function initSchemeSettings() {
    if (!document.body.classList.contains('controller-my') ||
        !document.body.classList.contains('action-account')) return;
    if (qs('#rm-schemes')) return; // idempotent
    var prefs = qs('#pref_comments_sorting');
    var prefsBox = prefs && prefs.closest('fieldset');
    if (!prefsBox) return;

    var box = document.createElement('fieldset');
    box.className = 'box';
    box.id = 'rm-schemes';
    var legend = document.createElement('legend');
    legend.textContent = 'Colour scheme';
    box.appendChild(legend);

    if (!schemesSupported()) {
      var na = document.createElement('p');
      na.className = 'rm-scheme-hint';
      na.textContent = 'This browser does not support colour schemes (needs CSS color-mix()).';
      box.appendChild(na);
    } else {
      [['Default', null], ['Dark', true], ['Light', false]].forEach(function (g) {
        var list = SCHEMES.filter(function (s) { return g[1] === null ? s.dark === null : s.dark === g[1]; });
        var head = document.createElement('div');
        head.className = 'rm-scheme-group';
        head.textContent = g[0];
        var grid = document.createElement('div');
        grid.className = 'rm-scheme-grid';
        grid.setAttribute('role', 'radiogroup');
        grid.setAttribute('aria-label', g[0] + ' colour schemes');
        list.forEach(function (s) {
          var card = schemeButton(s, 'rm-scheme-card');
          card.appendChild(schemePreview(s.swatch));
          card.appendChild(document.createTextNode(s.name));
          grid.appendChild(card);
        });
        box.appendChild(head);
        box.appendChild(grid);
      });
      box.appendChild(goghSearch());
      var hint = document.createElement('p');
      hint.className = 'rm-scheme-hint';
      hint.textContent = 'Applies immediately and is saved in this browser only. Palettes from Gogh (github.com/Gogh-Co/Gogh).';
      box.appendChild(hint);
    }
    prefsBox.parentNode.insertBefore(box, prefsBox.nextSibling);
    if (location.hash === '#rm-schemes') box.scrollIntoView();
  }

  /* ── TOASTS ──────────────────────────────────────────────── */
  var toastEl = null;

  function getToastContainer() {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'rm-toast-container';
      document.body.appendChild(toastEl);
    }
    return toastEl;
  }

  window.rmToast = function (message, type, duration) {
    type     = type     || 'info';
    duration = duration === undefined ? 3000 : duration;
    var icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

    var toast = document.createElement('div');
    toast.className = 'rm-toast rm-toast-' + type;
    var iconSpan = document.createElement('span');
    iconSpan.className = 'rm-toast-icon';
    iconSpan.textContent = icons[type] || icons.info;
    var textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);

    getToastContainer().appendChild(toast);

    setTimeout(function () {
      toast.classList.add('rm-toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, duration);
  };

  /* ── COLLAPSIBLE SECTIONS ────────────────────────────────── */
  function makeCollapsible(sectionId, label) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    // Scope to main content — sidebar-hosted sections (e.g. sidebar #watchers)
    // have their own spatial grouping and layout assumptions that the wrapper
    // breaks (Add link, delete icons, new-watcher form).
    if (!section.closest('#content')) return;

    var heading = qs('h3, h4, p strong, .subtitle', section);
    var title   = label || (heading ? heading.textContent.trim() : sectionId);
    var key     = 'rm-open-' + sectionId;
    var isOpen  = localStorage.getItem(key) !== '0';

    // Build header as button for keyboard + screen reader support
    var header = document.createElement('button');
    header.type = 'button';
    header.className = 'rm-collapsible-header' + (isOpen ? '' : ' is-collapsed');
    header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    var titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--c-text-subtle)';
    titleSpan.textContent = title;
    var toggleSpan = document.createElement('span');
    toggleSpan.className = 'rm-collapsible-toggle';
    toggleSpan.textContent = '▼';
    toggleSpan.setAttribute('aria-hidden', 'true');
    header.appendChild(titleSpan);
    header.appendChild(toggleSpan);

    // Wrap existing children in body
    var body = document.createElement('div');
    body.className = 'rm-collapsible-body' + (isOpen ? '' : ' is-collapsed');
    body.id = 'rm-collapsible-body-' + sectionId;
    header.setAttribute('aria-controls', body.id);
    while (section.firstChild) body.appendChild(section.firstChild);

    section.appendChild(header);
    section.appendChild(body);

    header.addEventListener('click', function () {
      var nowCollapsed = header.classList.toggle('is-collapsed');
      body.classList.toggle('is-collapsed', nowCollapsed);
      header.setAttribute('aria-expanded', nowCollapsed ? 'false' : 'true');
      localStorage.setItem(key, nowCollapsed ? '0' : '1');
    });

    // AJAX robustness: Redmine may re-render the section via XHR and append
    // fresh DOM directly to #section, outside our body. Catch those and move
    // them into .rm-collapsible-body so collapse still hides them.
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node === header || node === body) return;
          if (node.nodeType === 1 || node.nodeType === 3) body.appendChild(node);
        });
      });
    }).observe(section, { childList: true });
  }

  function initCollapsible() {
    makeCollapsible('issue_tree', 'Subtasks');
    makeCollapsible('relations',  'Related Issues');
    makeCollapsible('watchers',   'Watchers');
  }

  /* ── HIGHLIGHT ACTIVE NAV ────────────────────────────────── */
  function highlightNav() {
    var path = window.location.pathname;
    qsa('#top-menu ul li a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href && href !== '/' && path.indexOf(href) === 0) {
        a.classList.add('active');
        var li = a.closest('li');
        if (li) li.classList.add('selected');
      }
    });
  }

  /* ── RECONSOLIDATE SIDEBAR ──────────────────────────────
     Redmine's responsive.js detects "mobile" and moves #sidebar > *
     into .js-sidebar (flyout). Our theme shows #sidebar as a slide-in
     overlay instead of the flyout, so we need to move content back.
     Observe .js-sidebar so we handle late detaches (DOMContentLoaded
     ordering, window resize) without timing guesses. */
  function reconsolidateSidebar() {
    var src = qs('.js-sidebar');
    var dst = qs('#sidebar');
    if (!src || !dst) return;
    while (src.firstChild) dst.appendChild(src.firstChild);
  }
  function watchSidebar() {
    var src = qs('.js-sidebar');
    if (!src) return;
    new MutationObserver(reconsolidateSidebar).observe(src, { childList: true });
    reconsolidateSidebar();
  }

  /* ── PROJECT HEADER BADGE ───────────────────────────────── */
  function initProjectBadge() {
    var h1 = qs('#header h1');
    if (!h1) return;
    var curr = qs('.current-project', h1);
    if (!curr) return;
    if (qs('.rm-project-badge', h1)) return; // idempotent
    var words = (curr.textContent.match(/[A-Za-z0-9]+/g) || [curr.textContent]);
    var initials = words.slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    var badge = document.createElement('span');
    badge.className = 'rm-project-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = initials || '·';
    h1.insertBefore(badge, h1.firstChild);
  }

  /* ── ACCOUNT DROPDOWN ────────────────────────────────────
     Wrap the bare #account <ul> into a proper button + panel: avatar
     with user initials + name + caret, panel opens on click / hover. */
  function initAccountDropdown() {
    var account = qs('#account');
    if (!account) return;
    if (qs('.rm-account-trigger', account)) return; // idempotent
    // Logged-out state: show plain login link, nothing else
    if (qs('a.login', account)) return;

    var ul = qs('ul', account);
    if (!ul) return;

    var loggedas = qs('#loggedas');
    var userLink = loggedas && qs('a', loggedas);
    var username = userLink ? userLink.textContent.trim() : 'Account';
    var profileHref = userLink ? userLink.getAttribute('href') : '#';

    // Initials: first letters of up to 2 words (e.g. "Aleksandar Pavić" → "AP").
    // Fall back to first char or first two of a single-word login.
    var words = (username.match(/[\p{L}\p{N}]+/gu) || [username]);
    var initials;
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      initials = words[0].slice(0, 2).toUpperCase();
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'rm-account-dropdown';

    var trigger = document.createElement('button');
    trigger.className = 'rm-account-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'menu');

    var badge = document.createElement('span');
    badge.className = 'rm-account-avatar';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = initials;
    var nameSpan = document.createElement('span');
    nameSpan.className = 'rm-account-name';
    nameSpan.textContent = username;
    var caret = document.createElement('span');
    caret.className = 'rm-account-caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 3.5l3 3 3-3" stroke-linecap="round"/></svg>';
    trigger.appendChild(badge);
    trigger.appendChild(nameSpan);
    trigger.appendChild(caret);

    var panel = document.createElement('div');
    panel.className = 'rm-account-panel';
    panel.setAttribute('role', 'menu');

    // Header with full name + profile link
    var head = document.createElement('a');
    head.className = 'rm-account-panel-head';
    head.href = profileHref;
    head.setAttribute('role', 'menuitem');
    head.innerHTML = '<span class="rm-account-avatar rm-account-avatar-lg" aria-hidden="true">' + initials + '</span>' +
                    '<span><span class="rm-account-panel-name">' + username + '</span>' +
                    '<span class="rm-account-panel-view">View profile</span></span>';
    panel.appendChild(head);
    // Divider
    var sep = document.createElement('div');
    sep.className = 'rm-account-panel-sep';
    panel.appendChild(sep);
    // Clone the original ul so Redmine's links (My account / Sign out /
    // administration shortcut) are preserved. Hide original.
    panel.appendChild(ul.cloneNode(true));
    ul.setAttribute('data-rm-original', 'true');
    ul.style.display = 'none';

    wrapper.appendChild(trigger);
    account.insertBefore(wrapper, account.firstChild);
    // Mount the panel on <body> so it escapes #top-menu's cascade (white
    // text from #top-menu ul li a) and its overflow:hidden clip.
    document.body.appendChild(panel);
    if (loggedas) loggedas.style.display = 'none';

    function open() {
      // Track trigger position so the fixed panel aligns under it.
      var r = trigger.getBoundingClientRect();
      panel.style.top = (r.bottom + 6) + 'px';
      panel.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    function close() {
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.contains('is-open') ? close() : open();
    });
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) close();
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); trigger.focus(); }
    });
  }

  /* ── SEARCH WIDGET: magnifier icon inline ───────────────── */
  function initSearchWidget() {
    var form = qs('#quick-search form');
    var input = qs('#quick-search #q');
    if (!form || !input) return;
    if (qs('.rm-search-icon', form)) return; // idempotent
    input.setAttribute('placeholder', input.getAttribute('placeholder') || 'Search');
    // Hide the "Search:" label's visible text but keep the element for a11y.
    // Redmine renders <label for="q">Search:</label> as a stray text node
    // that otherwise collides with the magnifier.
    var label = qs('label', form);
    if (label) label.classList.add('rm-visually-hidden');
    // Also strip any loose text nodes inside the form ("Search:" lives
    // sometimes as raw text outside the label).
    Array.from(form.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && n.textContent.trim()) n.textContent = '';
    });
    var icon = document.createElement('span');
    icon.className = 'rm-search-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="4.5"/><path d="M10 10l3 3" stroke-linecap="round"/></svg>';
    input.parentNode.insertBefore(icon, input);
  }

  /* ── HAMBURGER MENU (mobile) ─────────────────────────────── */
  function initHamburger() {
    var topMenu = qs('#top-menu');
    if (!topMenu) return;

    var btn = document.createElement('button');
    btn.id = 'rm-hamburger';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    topMenu.insertBefore(btn, topMenu.firstChild);

    function close() {
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // close on outside tap
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('nav-open') && !topMenu.contains(e.target)) {
        close();
      }
    });

    // close when a nav link is tapped
    topMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    // close on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 899) close();
    });
  }

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    scheduleLayoutAdjust();
    initSidebar();
    initDarkMode();
    initCollapsible();
    highlightNav();
    initHamburger();
    initProjectBadge();
    initSearchWidget();
    initAccountDropdown();
    // A stored scheme that was since removed would leave the page without colours
    if (currentSchemeId() && !findScheme(currentSchemeId())) applyScheme('');
    initSchemePicker();
    initSchemeSettings();
    watchSidebar();
    window.addEventListener('resize', adjustLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
