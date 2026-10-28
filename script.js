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

  // Mobile menu
  var mb = d.getElementById('menuBtn'), nav = d.getElementById('nav');
  if (mb) mb.onclick = function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); };
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', false); } });

  // Scroll reveal
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // Animated counters
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function count(el) {
    var end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null;
    if (calm) { el.textContent = end + suf; return; }
    (function step(t) { t0 = t0 || t; var p = Math.min((t - t0) / 1600, 1); el.textContent = Math.round(end * p) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  var cs = d.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
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

  // Cookie banner
  var ck = d.getElementById('cookie');
  if (ck && !store('rw-cookie')) ck.classList.add('show');
  d.querySelectorAll('[data-cookie]').forEach(function (b) { b.onclick = function () { store('rw-cookie', b.dataset.cookie); ck.classList.remove('show'); }; });


  // Portfolio filters
  var fb = d.querySelectorAll('.filters button'), pj = d.querySelectorAll('.proj');
  fb.forEach(function (b) {
    b.onclick = function () {
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      pj.forEach(function (p) { p.hidden = !(b.dataset.filter === 'all' || p.dataset.cat === b.dataset.filter); });
    };
  });


  // Quote wizard (get-quote.html)
  var qf = d.getElementById('quoteForm');
  if (qf) {
    var steps = qf.querySelectorAll('.qstep'), cur = 0, bar = d.getElementById('qprog'), lab = d.getElementById('qlabel');
    var pk = new URLSearchParams(location.search).get('plan');
    if (pk && qf.elements.package) qf.elements.package.value = pk;
    function go(n) {
      cur = n;
      steps.forEach(function (s, k) { s.hidden = k !== n; });
      bar.style.width = ((n + 1) / steps.length * 100) + '%';
      lab.textContent = 'Step ' + (n + 1) + ' of ' + steps.length;
      steps[n].querySelector('legend').focus();
    }
    function bad(el, msg) { var s = steps[cur]; s.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); }); if (el) el.setAttribute('aria-invalid', 'true'); s.querySelector('.err').textContent = msg; if (el && el.focus) el.focus(); return false; }
    function ok() { steps[cur].querySelector('.err').textContent = ''; return true; }
    function check() {
      var f = qf.elements;
      if (cur === 0 && !qf.querySelector('[name=service]:checked')) return bad(qf.querySelector('[name=service]'), 'Please choose a service.');
      if (cur === 1 && f.description.value.trim().length < 20) return bad(f.description, 'Please describe your project in at least 20 characters.');
      if (cur === 2) { if (!f.budget.value) return bad(f.budget, 'Please choose a budget range.'); if (!f.timeline.value) return bad(f.timeline, 'Please choose a timeline.'); }
      if (cur === 3) {
        if (f.name.value.trim().length < 2) return bad(f.name, 'Please enter your name.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim())) return bad(f.email, 'Please enter a valid email address.');
        if (f.phone.value.trim() && f.phone.value.replace(/\D/g, '').length < 7) return bad(f.phone, 'Please enter a valid phone number.');
        if (!f.consent.checked) return bad(f.consent, 'Please tick the box so we may contact you.');
      }
      return ok();
    }
    qf.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { if (check()) go(cur + 1); }; });
    qf.querySelectorAll('[data-prev]').forEach(function (b) { b.onclick = function () { go(cur - 1); }; });
    go(0);
    qf.onsubmit = function (e) {
      e.preventDefault();
      if (qf.elements.company_site.value || !check()) return;
      var btn = qf.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Sending...';
      fetch(qf.action, { method: 'POST', body: new FormData(qf), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw 0; qf.hidden = true; d.getElementById('qprogwrap').hidden = true; var dn = d.getElementById('qdone'); dn.hidden = false; dn.focus(); })
        .catch(function () { btn.disabled = false; btn.textContent = 'Send my request'; bad(null, 'Sorry, we could not send your request. Please try again or chat with us on WhatsApp.'); });
    };
  }


  // Simple AJAX forms (contact, careers): add class "ajax" to a form
  d.querySelectorAll('form.ajax').forEach(function (f) {
    var msg = f.querySelector('.fmsg');
    f.onsubmit = function (e) {
      e.preventDefault();
      if (f.querySelector('[name=company_site]').value) return;
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var b = f.querySelector('[type=submit]'), t = b.textContent; b.disabled = true; b.textContent = 'Sending...';
      fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw 0; f.reset(); msg.className = 'fmsg ok'; msg.textContent = f.dataset.ok || 'Thank you! We will reply within one working day.'; })
        .catch(function () { msg.className = 'fmsg bad'; msg.textContent = 'Sorry, we could not send your message. Please try again or chat with us on WhatsApp.'; })
        .then(function () { b.disabled = false; b.textContent = t; });
    };
  });


  // Careers: "Apply now" pre-selects the role
  d.querySelectorAll('[data-role]').forEach(function (a) { a.addEventListener('click', function () { var s = d.getElementById('ar'); if (s) s.value = a.dataset.role; }); });

  // Footer year
  var y = d.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
