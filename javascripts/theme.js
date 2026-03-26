/* ============================================================
   MODERN REDMINE THEME — theme.js
   Auto-loaded by Redmine's heads_for_theme in <head>.

   IMPORTANT: The early dark-mode block runs SYNCHRONOUSLY so the
   html.dark-mode class is set before the body renders — no flash.
   ============================================================ */

/* ── EARLY DARK MODE (synchronous — must stay at top level) ── */
if (localStorage.getItem('rm-dark') === '1') {
  document.documentElement.classList.add('dark-mode');
}

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
      var isCollapsed = main.classList.toggle('sidebar-collapsed');
      document.body.classList.toggle('sidebar-collapsed', isCollapsed);
      btn.textContent = isCollapsed ? '›' : '‹';
      localStorage.setItem('rm-sidebar', isCollapsed ? '0' : '1');
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
      rmToast(nowDark ? 'Dark mode on' : 'Light mode on', 'info', 2000);
    });
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
    toast.innerHTML =
      '<span class="rm-toast-icon">' + (icons[type] || icons.info) + '</span>' +
      '<span>' + message + '</span>';

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

    var heading = qs('h3, h4, p strong, .subtitle', section);
    var title   = label || (heading ? heading.textContent.trim() : sectionId);
    var key     = 'rm-open-' + sectionId;
    var isOpen  = localStorage.getItem(key) !== '0';

    // Build header element
    var header = document.createElement('div');
    header.className = 'rm-collapsible-header' + (isOpen ? '' : ' is-collapsed');
    header.innerHTML =
      '<span style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--c-text-subtle)">' + title + '</span>' +
      '<span class="rm-collapsible-toggle">▼</span>';

    // Wrap existing children in body
    var body = document.createElement('div');
    body.className = 'rm-collapsible-body' + (isOpen ? '' : ' is-collapsed');
    while (section.firstChild) body.appendChild(section.firstChild);

    section.appendChild(header);
    section.appendChild(body);

    header.addEventListener('click', function () {
      var nowCollapsed = header.classList.toggle('is-collapsed');
      body.classList.toggle('is-collapsed', nowCollapsed);
      localStorage.setItem(key, nowCollapsed ? '0' : '1');
    });
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

  /* ── INIT ─────────────────────────────────────────────────── */
  function init() {
    scheduleLayoutAdjust();
    initSidebar();
    initDarkMode();
    initCollapsible();
    highlightNav();
    window.addEventListener('resize', adjustLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
