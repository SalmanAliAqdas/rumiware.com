/* Pure resolver contract: answer | topics | fallback. No network or UI dependencies. */
(function (scope) {
  'use strict';
  const fallback = 'For help with this question, please contact our team on WhatsApp.';
  function normalize(value) {
    return String(value).toLowerCase().replace(/\b(webiste|websit|wesbite)\b/g, 'website').replace(/\b(prcing|pricng)\b/g, 'pricing').replace(/\b(whatsap|whatsapp)\b/g, 'whatsapp').replace(/\b(enquery|inquiry)\b/g, 'enquiry').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  const stop = new Set('a an the is are do does can could would will you your i my me we our to for of on in with it please tell about what how'.split(' '));
  const words = s => normalize(s).split(' ').filter(w => w && !stop.has(w));
  function createResolver(entries) {
    const indexed = entries.map(entry => ({entry, variants:[entry.question, ...entry.alternates].map(normalize)}));
    return function resolve(question) {
      const q = normalize(String(question).slice(0, 400));
      const fail = {type:'fallback', answer:fallback};
      if (!q) return fail;
      if (/\b(human|person|representative|agent|someone|team member)\b/.test(q) && !/\b(ai agents?|software)\b/.test(q)) return fail;
      const exact = indexed.filter(x => x.variants.includes(q));
      if (exact.length === 1) return {type:'answer', entry:exact[0].entry};
      // Curated questions can contain conjunctions; unrecognized combined requests need choices.
      if (/\b(and|also|plus)\b/.test(q) || /[?].*\S/.test(String(question).trim())) return {type:'topics', answer:'Please choose one question at a time.', ids:[]};
      // All meaningful visitor words must occur in a variant; extra unknown qualifiers
      // (refund, guarantee, free, etc.) cannot be silently ignored.
      const input = words(q);
      if (input.length < 2 || /\b(not|never|guarantee|guaranteed|refund|unlimited|cheapest)\b/.test(q)) return fail;
      const scored = indexed.map(x => ({entry:x.entry, score:Math.max(...x.variants.map(v => {
        const tokens = new Set(words(v));
        return input.every(w => tokens.has(w)) ? input.length / Math.max(tokens.size, input.length) : 0;
      }))})).filter(x => x.score >= .7).sort((a,b) => b.score-a.score);
      if (!scored.length) return fail;
      if (scored.length > 1 && scored[0].score-scored[1].score < .2) return {type:'topics', answer:'Which question would you like to explore?', ids:scored.slice(0,3).map(x => x.entry.id)};
      return {type:'answer', entry:scored[0].entry};
    };
  }
  const api = {normalize, createResolver, fallback};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else scope.RumiFaq = api;
})(typeof window === 'object' ? window : globalThis);
