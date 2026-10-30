(function () {
  'use strict';
  const d = document, data = JSON.parse(d.getElementById('chat-data').textContent);
  const panel = d.getElementById('rumi-chat'), launcher = d.getElementById('chat-launcher');
  const input = d.getElementById('chat-question'), messages = d.getElementById('chat-messages'), choices = d.getElementById('chat-choices'), announcement = d.getElementById('chat-announcement');
  const resolve = window.RumiFaq.createResolver(data.entries);
  // The asset URL supplies the correct base at root, nested articles and preview mounts.
  const base = new URL('.', d.querySelector('script[src*="chatbot.js"]').src);
  function link(label, href, parent) {
    const a = d.createElement('a'); a.textContent = label;
    const url = new URL(href, base);
    if (url.protocol !== 'https:' && url.origin !== location.origin) return;
    a.href = url.href;
    if (url.origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', label + ' (opens in a new tab)'); }
    parent.append(a);
  }
  function message(text, visitor, links) {
    const block = d.createElement('div'); block.className = visitor ? 'chat-message visitor' : 'chat-message';
    const p = d.createElement('p'); p.textContent = (visitor ? 'You: ' : '') + text; block.append(p);
    (links || []).forEach(item => link(item.label, item.url, block));
    messages.append(block);
    // Bound memory and DOM size during very long sessions.
    while (messages.children.length > 80) messages.firstElementChild.remove();
    messages.scrollTop = messages.scrollHeight;
    if (!visitor) announcement.textContent = text;
  }
  function button(label, callback) { const b = d.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = () => { callback(); if (!d.contains(b)) (choices.querySelector('button') || input).focus(); }; choices.append(b); }
  function categories() {
    choices.replaceChildren();
    [...new Set(data.entries.map(e => e.category))].forEach(category => button(category, () => topic(category)));
  }
  function topic(category) {
    choices.replaceChildren(); message('Choose a question about ' + category.toLowerCase() + '.');
    data.entries.filter(e => e.category === category).forEach(e => button(e.question, () => answer(e)));
    button('All topics', categories);
  }
  function initial() {
    choices.replaceChildren();
    button('Our Services', () => topic('Services')); button('Explore Projects', () => topic('Projects'));
    button('Request a Quote', () => answer(data.entries.find(e => e.id === 'request-quote')));
    link('Contact on WhatsApp', data.whatsapp, choices); button('All topics', categories);
  }
  function answer(entry) { message(entry.answer, false, entry.links); initial(); }
  function send() {
    const question = input.value.trim().slice(0,400); if (!question) return;
    input.value = ''; message(question, true);
    const result = resolve(question);
    if (result.type === 'answer') answer(result.entry);
    else if (result.type === 'topics') {
      message(result.answer); choices.replaceChildren();
      if (result.ids.length) result.ids.forEach(id => { const entry = data.entries.find(e => e.id === id); button(entry.question, () => answer(entry)); });
      else categories();
    } else { message(result.answer, false, [{label:'Chat on WhatsApp',url:data.whatsapp}]); initial(); }
  }
  function close() { panel.hidden = true; launcher.setAttribute('aria-expanded','false'); launcher.focus(); }
  launcher.onclick = () => { if (!panel.hidden) return close(); panel.hidden = false; launcher.setAttribute('aria-expanded','true'); fitViewport(); input.focus({preventScroll:true}); };
  d.getElementById('chat-close').onclick = close;
  d.getElementById('chat-reset').onclick = () => { messages.replaceChildren(); input.value = ''; welcome(); input.focus(); };
  d.getElementById('chat-send').onclick = send;
  input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); send(); } });
  d.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(); } });
  d.addEventListener('focusin', event => { if (event.target.closest('form')) { panel.hidden = true; launcher.setAttribute('aria-expanded','false'); } });
  // Non-modal region: Tab remains free to reach the page and permanent contact action.
  function fitViewport() {
    const viewport = window.visualViewport || {height:window.innerHeight,offsetTop:0};
    panel.style.top = Math.max(8,viewport.offsetTop+8)+'px';
    panel.style.maxHeight = Math.max(100,viewport.height-16)+'px';
    panel.style.setProperty('--chat-viewport-height',viewport.height+'px');
    // Mobile keyboards can shrink VisualViewport without changing CSS media queries.
    panel.classList.toggle('chat-short',viewport.height<=580);
    panel.classList.toggle('chat-compact',viewport.height<=360);
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize',fitViewport); window.visualViewport.addEventListener('scroll',fitViewport); }
  window.addEventListener('resize',fitViewport);
  new MutationObserver(() => { if (!d.getElementById('cookie').hidden) { panel.hidden = true; launcher.setAttribute('aria-expanded','false'); } }).observe(d.getElementById('cookie'),{attributes:true,attributeFilter:['hidden']});
  function welcome() { message('Welcome to RumiWare. Choose a topic or type your question. For a tailored discussion, you can contact our team on WhatsApp.'); initial(); }
  welcome(); launcher.hidden = false;
})();
