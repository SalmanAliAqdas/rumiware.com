/* Rumiware shared script.js - theme, menu, reveal, counters, slider, cookie, back-to-top */
(function () {
  var d = document, root = d.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} }

  // Theme (dark is default; choice is remembered)
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    var b = d.getElementById('themeBtn');
    if (b) { b.textContent = t === 'dark' ? '\u2600' : '\u263E'; b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); }
  }
  setTheme(store('rw-theme') === 'light' ? 'light' : 'dark');
  var tb = d.getElementById('themeBtn');
  if (tb) tb.onclick = function () { var n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; setTheme(n); store('rw-theme', n); };
  if (tb) root.classList.add('theme-ready');

  // Mobile menu
  var mb = d.getElementById('menuBtn'), nav = d.getElementById('nav');
  if (mb && nav) {
    // A breakpoint can hide a focused link before the media-query callback runs.
    // Remember real focus changes so that focus can return to the disclosure.
    var navigationHadFocus = nav.contains(d.activeElement);
    function closeMenu(returnFocus) {
      nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.setAttribute('aria-label', 'Open menu');
      if (returnFocus) mb.focus();
    }
    mb.onclick = function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open); mb.setAttribute('aria-expanded', String(open));
      mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      // Focus stays on the disclosure; the next Tab enters the menu.
    };
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { e.preventDefault(); closeMenu(true); }
      // The disclosure follows the nav in source order. Give it an intentional Tab entry.
      if (e.key === 'Tab' && !e.shiftKey && d.activeElement === mb && nav.classList.contains('open')) {
        var first = nav.querySelector('a[href]'); if (first) { e.preventDefault(); first.focus(); }
      }
    });
    d.addEventListener('click', function (e) { if (!e.target.closest('header')) closeMenu(false); });
    d.addEventListener('focusin', function (e) {
      navigationHadFocus = nav.contains(e.target);
      if (!navigationHadFocus && e.target !== mb) closeMenu(false);
    });
    var menuMedia = window.matchMedia ? matchMedia('(max-width:1099px)') : null;
    function resizeMenu() {
      var wasInside = nav.contains(d.activeElement) ||
        (navigationHadFocus && (d.activeElement === d.body || d.activeElement === root));
      closeMenu(getComputedStyle(mb).display !== 'none' && wasInside);
    }
    if (menuMedia && menuMedia.addEventListener) menuMedia.addEventListener('change', resizeMenu);
    else if (menuMedia && menuMedia.addListener) menuMedia.addListener(resizeMenu);
    root.classList.add('menu-ready');
  }

  // Scroll reveal
  var rv = d.querySelectorAll('.rv');
  var calm = !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.matchMedia) {
    var motionMedia = matchMedia('(prefers-reduced-motion: reduce)');
    if (motionMedia.addEventListener) motionMedia.addEventListener('change', function (e) {
      calm = e.matches;
      if (calm) { root.classList.remove('reveal-ready'); if (timer) clearInterval(timer); }
    });
  }
  if ('IntersectionObserver' in window && !calm) {
    try {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
      rv.forEach(function (el) { io.observe(el); });
      // Content stays visible unless the observer was successfully constructed and attached.
      root.classList.add('reveal-ready');
    } catch (e) { root.classList.remove('reveal-ready'); }
  }

  // Animated counters
  function count(el) {
    var end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null;
    if (calm) { el.textContent = end + suf; return; }
    (function step(t) { t0 = t0 || t; var p = Math.min((t - t0) / 1600, 1); el.textContent = Math.round(end * p) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  var cs = d.querySelectorAll('[data-count]');
  if (cs.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { count(e.target); co.unobserve(e.target); } }); });
    cs.forEach(function (el) { co.observe(el); });
  } else cs.forEach(count);

  // Testimonial slider
  var slides = d.querySelectorAll('.slide'), dots = d.querySelectorAll('.dots button'), i = 0, timer;
  function show(n) { i = (n + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle('on', k === i); }); dots.forEach(function (b, k) { b.setAttribute('aria-current', k === i); }); }
  dots.forEach(function (b, k) { b.onclick = function () { show(k); }; });
  if (slides.length) { show(0); if (!calm) timer = setInterval(function () { show(i + 1); }, 6000); }

  // Back to top
  var top = d.getElementById('top');
  if (top) { addEventListener('scroll', function () { top.classList.toggle('show', scrollY > 600); }, { passive: true }); top.onclick = function () { scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); }; }

  // Basic consent: no Google resource is created until this version is accepted.
  var analyticsConfig;
  try { analyticsConfig = JSON.parse(d.getElementById('analytics-config').textContent); } catch (e) {}
  var analyticsId = analyticsConfig && analyticsConfig.measurementId;
  var consentKey = analyticsConfig ? analyticsConfig.consentKey : 'rw-analytics-v1';
  var analyticsFrame, pageMeasured = false, consentChoice = store(consentKey);
  var analyticsAllowed = !!analyticsConfig && analyticsConfig.productionOrigins.indexOf(location.origin) !== -1 &&
    analyticsConfig.publicPaths.indexOf(location.pathname) !== -1 && location.pathname === analyticsConfig.pagePath &&
    !d.querySelector('meta[name="robots"][content*="noindex"]');
  if (analyticsId) window['ga-disable-' + analyticsId] = true;
  function clearAnalyticsCookies() {
    var paths = ['/'], parts = location.pathname.split('/').filter(Boolean), path = '';
    parts.forEach(function (part) { path += '/' + part; paths.push(path, path + '/'); });
    var domains = [''], host = location.hostname.split('.');
    while (host.length > 1) { domains.push(host.join('.'), '.' + host.join('.')); host.shift(); }
    var cookies; try { cookies = d.cookie; } catch (e) { return; }
    cookies.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) return;
      paths.forEach(function (p) { domains.forEach(function (domain) {
        try { d.cookie = name + '=; Max-Age=0; path=' + p + (domain ? '; domain=' + domain : '') + '; SameSite=Lax'; } catch (e) {}
      }); });
    });
  }
  function stopAnalytics() {
    if (analyticsId) window['ga-disable-' + analyticsId] = true;
    if (analyticsFrame) {
      // Google's documented opt-out flag takes effect before destroying the context.
      try { analyticsFrame.contentWindow['ga-disable-' + analyticsId] = true; } catch (e) {}
      analyticsFrame.remove(); analyticsFrame = null;
    }
    clearAnalyticsCookies();
  }
  function startAnalytics() {
    if (!analyticsAllowed || analyticsFrame || pageMeasured) return;
    window['ga-disable-' + analyticsId] = false;
    var referrer = '';
    // Keep only a known public path; external referrers are reduced to their origin.
    try {
      var ref = new URL(d.referrer);
      if (/^https?:$/.test(ref.protocol)) referrer = ref.origin +
        (analyticsConfig.productionOrigins.indexOf(ref.origin) !== -1 && analyticsConfig.publicPaths.indexOf(ref.pathname) !== -1 ? ref.pathname : '/');
    } catch (e) {}
    var config = {
      send_page_view: false, page_location: analyticsConfig.pageLocation,
      page_referrer: referrer, page_title: analyticsConfig.pageTitle,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_flags: 'SameSite=Lax;Secure', cookie_path: '/', cookie_expires: 34560000,
      // Do not accept user-provided campaign overrides from the parent URL.
      campaign_source: '', campaign_medium: '', campaign_name: '', campaign_term: '', campaign_content: '', campaign_id: ''
    };
    // Isolate the tag from forms, chat, links, history and the visitor's raw URL.
    // Removing this frame also stops engagement timers and unload collection.
    analyticsFrame = d.createElement('iframe');
    analyticsFrame.hidden = true; analyticsFrame.title = 'Consented page analytics';
    analyticsFrame.referrerPolicy = 'no-referrer';
    analyticsFrame.src = '/analytics-frame.htm';
    analyticsFrame.onload = function () {
      if (!analyticsFrame) return;
      analyticsFrame.contentWindow.postMessage({type:'rw-page-analytics', measurementId:analyticsId, config:config}, location.origin);
    };
    pageMeasured = true;
    d.body.appendChild(analyticsFrame);
  }
  if (consentChoice === 'yes') startAnalytics(); else stopAnalytics();
  var ck = d.getElementById('cookie');
  var privacyStatus = d.getElementById('privacy-status');
  var privacyTrigger;
  function showPrivacyStatus() {
    if (!privacyStatus) return;
    var choice = consentChoice;
    privacyStatus.textContent = choice === 'no' ? 'Your saved preference is Decline. Optional analytics declined; analytics are off.' :
      choice === 'yes' ? 'Your saved preference is Accept. ' + (analyticsAllowed ? 'Page analytics are allowed. Decline analytics to withdraw consent.' : 'Analytics are off on this development or preview page.') :
      'Analytics are off until you accept. Choose Accept analytics or Decline analytics.';
    if ((choice === 'yes' || choice === 'no') && store(consentKey) !== choice) privacyStatus.textContent = 'Browser storage is unavailable; this choice lasts for this page only. ' + (choice === 'yes' && analyticsAllowed ? 'Page analytics are allowed.' : 'Analytics are off.');
  }
  function closePrivacy() {
    if (ck) ck.hidden = true;
    if (privacyTrigger) privacyTrigger.focus();
  }
  d.querySelectorAll('[data-privacy-open]').forEach(function (b) { b.onclick = function () {
    if (!ck || !privacyStatus || !ck.querySelector('[data-cookie]')) return;
    privacyTrigger = b; ck.hidden = false; showPrivacyStatus();
    ck.querySelector('[data-cookie]').focus();
  }; });
  d.querySelectorAll('[data-cookie]').forEach(function (b) { b.onclick = function () {
    var choice = b.getAttribute('data-cookie');
    consentChoice = choice; store(consentKey, choice);
    if (choice === 'yes') startAnalytics(); else stopAnalytics();
    showPrivacyStatus();
    if (!privacyTrigger) closePrivacy();
  }; });
  d.querySelectorAll('[data-privacy-close]').forEach(function (b) { b.onclick = closePrivacy; });
  d.addEventListener('keydown', function (e) {
    if (!ck || ck.hidden) return;
    if (e.key === 'Escape') { closePrivacy(); return; }
    if (e.key === 'Tab') {
      var controls = ck.querySelectorAll('a,button'), first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  addEventListener('storage', function (e) {
    if (e.key === consentKey || e.key === null) {
      consentChoice = store(consentKey);
      if (consentChoice === 'yes') startAnalytics(); else stopAnalytics();
      showPrivacyStatus();
    }
  });
  // A fresh visitor sees both choices; the notice never takes focus on page load.
  if (ck && consentChoice !== 'yes' && consentChoice !== 'no') { ck.hidden = false; showPrivacyStatus(); }

  // One bounded submission path for contact and quote forms. No automatic retries.
  function sendForm(form, status, success) {
    if (!status || form.getAttribute('aria-busy') === 'true') return;
    var body = new FormData(form), controller = new AbortController();
    var controls = Array.from(form.querySelectorAll('input,textarea,select,button'));
    var disabled = controls.map(function (el) { return el.disabled; });
    var button = form.querySelector('[type=submit]'), label = button.textContent;
    form.setAttribute('aria-busy', 'true');
    controls.forEach(function (el) { el.disabled = true; });
    button.textContent = 'Sending...'; status.className = 'fmsg'; status.textContent = 'Sending your request…';
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    fetch(form.action, { method: 'POST', body: body, headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('provider');
        status.className = 'fmsg ok'; success();
      })
      .catch(function (error) {
        status.className = 'fmsg bad';
        status.textContent = error.name === 'AbortError'
          ? 'The request timed out. Receipt is unconfirmed. Your entries are kept; please contact us by email or WhatsApp before retrying.'
          : 'We could not confirm your request. Your entries are kept. Please try again, email us or chat on WhatsApp.';
        status.focus();
      })
      .finally(function () {
        clearTimeout(timeout); controls.forEach(function (el, i) { el.disabled = disabled[i]; });
        form.removeAttribute('aria-busy'); button.textContent = label;
      });
  }


  // Portfolio filters
  var fb = d.querySelectorAll('.filters button'), pj = d.querySelectorAll('.proj');
  var filterGroup = d.querySelector('.filters'), projectCount = d.getElementById('project-count');
  function reportProjects() {
    if (projectCount) {
      var count = Array.from(pj).filter(function (p) { return !p.hidden; }).length;
      projectCount.hidden = false; projectCount.textContent = count + (count === 1 ? ' project shown' : ' projects shown');
    }
  }
  fb.forEach(function (b) {
    b.onclick = function () {
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      pj.forEach(function (p) { p.hidden = !(b.dataset.filter === 'all' || p.dataset.cat === b.dataset.filter); });
      reportProjects();
    };
  });
  if (fb.length && pj.length && filterGroup) {
    filterGroup.hidden = false; reportProjects();
    // A direct project link must remain usable after a previous filter selection.
    window.addEventListener('hashchange', function () {
      var target = d.getElementById(location.hash.slice(1));
      if (target && target.classList.contains('proj') && target.hidden) {
        fb[0].click(); target.scrollIntoView();
      }
    });
  }


  // Quote wizard (get-quote.html)
  var qf = d.getElementById('quoteForm');
  if (qf && qf.querySelectorAll('.qstep').length === 4 &&
      Array.from(qf.querySelectorAll('.qstep')).every(function (s) { return s.querySelector('legend') && s.querySelector('.err'); }) &&
      ['service','description','budget','timeline','name','email','phone','consent','company_site','package'].every(function (name) { return qf.elements.namedItem(name); }) &&
      d.getElementById('qprog') && d.getElementById('qlabel') && d.getElementById('qprogwrap') &&
      d.getElementById('qstatus') && d.getElementById('qdone') && qf.querySelector('[type=submit]') &&
      window.fetch && window.FormData && window.AbortController) {
    var steps = qf.querySelectorAll('.qstep'), cur = 0, bar = d.getElementById('qprog'), lab = d.getElementById('qlabel');
    steps.forEach(function (s, n) {
      var error = s.querySelector('.err'); error.id = 'qerror-' + n;
      s.querySelectorAll('input,select,textarea').forEach(function (el) {
        el.setAttribute('aria-describedby', (el.getAttribute('aria-describedby') || 'quote-help') + ' ' + error.id);
      });
    });
    var pk = new URLSearchParams(location.search).get('plan');
    var packageData = d.getElementById('quote-packages');
    var plans = {};
    try { plans = JSON.parse(packageData ? packageData.textContent : '{}'); } catch (e) {}
    qf.elements.package.value = Object.prototype.hasOwnProperty.call(plans, pk) ? pk : '';
    var selected = d.getElementById('selected-package');
    if (selected) selected.textContent = qf.elements.package.value ? 'Selected package: ' + plans[pk].label + '. ' + plans[pk].summary : 'No pricing package selected.';
    function review() {
      var list = d.getElementById('quote-review'); if (!list) return;
      var f = qf.elements, service = qf.querySelector('[name=service]:checked');
      var entries = [['Package', plans[f.package.value] ? plans[f.package.value].label : 'No package selected'], ['Service', service ? service.value : 'Not selected'],
        ['Project', f.description.value.trim()], ['Budget', f.budget.value], ['Timeline', f.timeline.value]];
      if (f.links && f.links.value.trim()) entries.push(['Links / files', f.links.value.trim()]);
      list.replaceChildren();
      entries.forEach(function (entry) {
        var dt = d.createElement('dt'), dd = d.createElement('dd'); dt.textContent = entry[0]; dd.textContent = entry[1]; list.append(dt, dd);
      });
    }
    function go(n, moveFocus) {
      if (n < 0 || n >= steps.length) return;
      cur = n;
      steps.forEach(function (s, k) { s.hidden = k !== n; });
      bar.style.width = ((n + 1) / steps.length * 100) + '%';
      lab.textContent = 'Step ' + (n + 1) + ' of ' + steps.length;
      if (n === steps.length - 1) review();
      if (moveFocus) steps[n].querySelector('legend').focus();
    }
    function check(n, moveFocus) {
      var f = qf.elements, s = steps[n], issues = [];
      s.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
      function issue(el, message) { issues.push({element:el,message:message}); el.setAttribute('aria-invalid','true'); }
      if (n === 0 && !qf.querySelector('[name=service]:checked')) issue(qf.querySelector('[name=service]'), 'Please choose a service.');
      if (n === 1 && f.description.value.trim().length < 20) issue(f.description, 'Please describe your project in at least 20 characters.');
      if (n === 2) {
        if (!f.budget.value) issue(f.budget, 'Please choose a budget range.');
        if (!f.timeline.value) issue(f.timeline, 'Please choose a timeline.');
      }
      if (n === 3) {
        if (f.name.value.trim().length < 2) issue(f.name, 'Please enter your name (at least 2 characters).');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim()) || !f.email.validity.valid) issue(f.email, 'Please enter a valid email address.');
        if (f.phone.value.trim() && f.phone.value.replace(/\D/g, '').length < 7) issue(f.phone, 'Please enter a valid phone number or leave it empty.');
        if (!f.consent.checked) issue(f.consent, 'Please tick the box so we may contact you.');
      }
      s.dataset.validated = 'true';
      s.querySelector('.err').textContent = issues.map(function (i) { return i.message; }).join(' ');
      if (moveFocus && issues.length) issues[0].element.focus();
      return issues.length === 0;
    }
    function clearStaleErrors() { if (steps[cur].dataset.validated) check(cur, false); }
    qf.addEventListener('input', clearStaleErrors); qf.addEventListener('change', clearStaleErrors);
    qf.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { if (check(cur, true)) go(cur + 1, true); }; });
    qf.querySelectorAll('[data-prev]').forEach(function (b) { b.onclick = function () { go(cur - 1, true); }; });
    go(0, false);
    qf.onsubmit = function (e) {
      e.preventDefault();
      if (qf.getAttribute('aria-busy') === 'true' || qf.elements.company_site.value) return;
      // Enter on an earlier step advances through validation instead of sending.
      if (cur < steps.length - 1) { if (check(cur, true)) go(cur + 1, true); return; }
      // Recheck all steps in case a value was changed after navigating back.
      for (var n = 0; n < steps.length; n++) { if (!check(n, false)) { go(n, false); check(n, true); return; } }
      sendForm(qf, d.getElementById('qstatus'), function () {
        qf.hidden = true; d.getElementById('qprogwrap').hidden = true;
        var dn = d.getElementById('qdone'); dn.hidden = false; dn.focus();
      });
    };
    // Reveal the enhanced flow only after every required element and handler is ready.
    qf.hidden = false; d.getElementById('qprogwrap').hidden = false;
    var alternative = d.getElementById('quote-alternative'); if (alternative) alternative.hidden = true;
  }


  // Contact form uses native constraint validation before the shared sender.
  d.querySelectorAll('form.ajax').forEach(function (f) {
    var msg = f.parentElement.querySelector('.fmsg');
    if (!msg || !f.querySelector('[type=submit]') || !window.fetch || !window.AbortController) return;
    f.onsubmit = function (e) {
      e.preventDefault();
      var honeypot = f.querySelector('[name=company_site]');
      if (f.getAttribute('aria-busy') === 'true' || (honeypot && honeypot.value)) return;
      if (!f.checkValidity()) { f.reportValidity(); return; }
      sendForm(f, msg, function () {
        f.reset(); msg.textContent = f.dataset.ok || 'Your message was accepted by our form provider.'; msg.focus();
      });
    };
  });


  // Careers: "Apply now" pre-selects the role
  d.querySelectorAll('[data-role]').forEach(function (a) { a.addEventListener('click', function () { var s = d.getElementById('ar'); if (s) s.value = a.dataset.role; }); });

  // Footer year
  var y = d.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
