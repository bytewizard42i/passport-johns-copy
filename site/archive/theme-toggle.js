// Midnight Passport — theme toggle.
// Cycles: Auto (no attribute) → Light → Dark → Auto. Persists in localStorage.
(function theme() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const saved = localStorage.getItem('passport-theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme');
    let next;
    if (!cur) next = 'light';
    else if (cur === 'light') next = 'dark';
    else next = null;
    if (next) {
      root.setAttribute('data-theme', next);
      localStorage.setItem('passport-theme', next);
    } else {
      root.removeAttribute('data-theme');
      localStorage.removeItem('passport-theme');
    }
  });
})();
