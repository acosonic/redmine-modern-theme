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
    watchSidebar();
    window.addEventListener('resize', adjustLayout);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
