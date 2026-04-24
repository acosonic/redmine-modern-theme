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
    window.addEventListener('resize', adjustLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
