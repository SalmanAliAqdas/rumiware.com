module.exports = async () => {
  // A separately started ordinary preview ignores this and stays running.
  try { await fetch('http://127.0.0.1:4173/__qa_stop', {method:'POST', signal:AbortSignal.timeout(2000)}); } catch {}
};
