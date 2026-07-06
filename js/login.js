/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Login Page Script
   ═══════════════════════════════════════════════════════════ */

const form       = document.getElementById('loginForm');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const errorEl    = document.getElementById('loginError');
const submitBtn  = document.getElementById('submitBtn');
const btnText    = document.getElementById('btnText');
const btnLoader  = document.getElementById('btnLoader');

// If already authenticated, skip to /admin
(async () => {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (data.authenticated) window.location.replace('/admin');
  } catch { /* ignore */ }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  if (!username || !password) {
    showError('Please enter both username and password.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Success — animate and redirect
      form.classList.add('login-success');
      setTimeout(() => window.location.replace('/admin'), 600);
    } else {
      showError(data.error || 'Login failed. Please try again.');
      shakeForm();
    }
  } catch (err) {
    showError('Network error. Please check your connection.');
    shakeForm();
  } finally {
    setLoading(false);
  }
});

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('show');
}

function clearError() {
  errorEl.textContent = '';
  errorEl.classList.remove('show');
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  btnText.style.opacity = loading ? '0' : '1';
  btnLoader.style.display = loading ? 'block' : 'none';
}

function shakeForm() {
  const card = document.querySelector('.login-card');
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 500);
}

// Toggle password visibility
const toggleBtn = document.getElementById('togglePassword');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const type = passwordEl.type === 'password' ? 'text' : 'password';
    passwordEl.type = type;
    toggleBtn.querySelector('.eye-open').style.display  = type === 'password' ? 'block' : 'none';
    toggleBtn.querySelector('.eye-closed').style.display = type === 'password' ? 'none' : 'block';
  });
}
