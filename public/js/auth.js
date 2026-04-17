// ═══════════════════════════════════════════════════════════
// corntex — Auth Module
// ═══════════════════════════════════════════════════════════

const API_BASE = '';

// ─── Token Management ───────────────────────────────────────

function getToken() {
  return localStorage.getItem('shorten_token');
}

function setToken(token) {
  localStorage.setItem('shorten_token', token);
}

function clearToken() {
  localStorage.removeItem('shorten_token');
  localStorage.removeItem('shorten_user');
}

function getUser() {
  const user = localStorage.getItem('shorten_user');
  return user ? JSON.parse(user) : null;
}

function setUser(user) {
  localStorage.setItem('shorten_user', JSON.stringify(user));
}

function isLoggedIn() {
  return !!getToken();
}

// ─── Auth Headers ───────────────────────────────────────────

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ─── UI State ───────────────────────────────────────────────

function updateAuthUI() {
  const navAuth = document.getElementById('navAuth');
  const navUser = document.getElementById('navUser');
  const userName = document.getElementById('userName');
  const resultHint = document.getElementById('resultHint');

  if (!navAuth || !navUser) return;

  if (isLoggedIn()) {
    const user = getUser();
    navAuth.classList.add('hidden');
    navUser.classList.remove('hidden');
    if (userName && user) userName.textContent = user.name;
    if (resultHint) resultHint.classList.add('hidden');
  } else {
    navAuth.classList.remove('hidden');
    navUser.classList.add('hidden');
    if (resultHint) resultHint.classList.remove('hidden');
  }
}

// ─── Modal ──────────────────────────────────────────────────

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('hidden');
    switchTab(tab);
    hideAuthError();
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    hideAuthError();
  }
}

function switchTab(tab) {
  const tabs = document.querySelectorAll('[data-tab]');
  tabs.forEach(t => {
    const isActive = t.getAttribute('data-tab') === tab;
    t.setAttribute('data-active', isActive);
  });

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authError = document.getElementById('authError');

  if (authError) authError.classList.add('hidden');

  if (loginForm && registerForm) {
    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
  }
}

function showAuthError(message) {
  const el = document.getElementById('authError');
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function hideAuthError() {
  const el = document.getElementById('authError');
  if (el) el.classList.add('hidden');
}

// ─── Login ──────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    showAuthError('Completa todos los campos');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Iniciando...';
  hideAuthError();

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showAuthError(data.error || 'Error al iniciar sesión');
      return;
    }

    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    updateAuthUI();
    showToast('¡Bienvenido, ' + data.user.name + '!', 'success');
  } catch (err) {
    showAuthError('Error de conexión. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Iniciar Sesión';
  }
}

// ─── Register ───────────────────────────────────────────────

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('registerBtn');

  if (!name || !email || !password) {
    showAuthError('Completa todos los campos');
    return;
  }

  if (!validator.isLength(password, { min: 8 })) {
    showAuthError('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    showAuthError('La contraseña no cumple con todos los requisitos de seguridad');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';
  hideAuthError();

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showAuthError(data.error || 'Error al crear la cuenta');
      return;
    }

    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    updateAuthUI();
    showToast('¡Cuenta creada! Bienvenido, ' + data.user.name, 'success');
  } catch (err) {
    showAuthError('Error de conexión. Intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear Cuenta';
  }
}

// ─── Logout ─────────────────────────────────────────────────

function logout() {
  clearToken();
  // If on dashboard, redirect to home
  if (window.location.pathname.includes('dashboard')) {
    window.location.href = '/';
  } else {
    updateAuthUI();
    showToast('Sesión cerrada', 'success');
  }
}

// ─── Toast ──────────────────────────────────────────────────

function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  
  // Base classes for Tailwind toast
  const baseClasses = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 opacity-0 translate-y-4 pointer-events-none border backdrop-blur-md';
  let typeClasses = 'bg-deep-card/90 text-white border-white/10';
  
  if (type === 'success') typeClasses = 'bg-green-500/20 text-green-400 border-green-500/20';
  if (type === 'error') typeClasses = 'bg-red-500/20 text-red-400 border-red-500/20';

  toast.className = `${baseClasses} ${typeClasses}`;

  // Trigger show
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  // Auto-hide
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3000);
}

// ─── Modal close on overlay click ───────────────────────────

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const authModal = document.getElementById('authModal');
    if (authModal && !authModal.classList.contains('hidden')) {
      closeAuthModal();
    }
  }
});

// ─── Escape key to close modal ──────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthModal();
  }
});

// ─── Navbar scroll effect ───────────────────────────────────

let lastScroll = 0;
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-2xl', 'border-white/10', 'bg-deep-dark/95');
      navbar.classList.remove('bg-deep-dark/80', 'border-white/5');
    } else {
      navbar.classList.remove('shadow-2xl', 'border-white/10', 'bg-deep-dark/95');
      navbar.classList.add('bg-deep-dark/80', 'border-white/5');
    }
  }
});

// ─── Password Strength Logic ────────────────────────────────

function initPasswordWatcher() {
  const input = document.getElementById('regPassword');
  const container = document.getElementById('pwStrengthContainer');
  const bar = document.getElementById('pwStrengthBar');
  const btn = document.getElementById('registerBtn');

  if (!input) return;

  input.addEventListener('focus', () => container.classList.remove('hidden'));
  
  input.addEventListener('input', () => {
    const val = input.value;
    const rules = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val)
    };

    // Update checklist
    Object.keys(rules).forEach(id => {
      const el = document.getElementById(`rule-${id}`);
      if (el) {
        if (rules[id]) {
          el.classList.remove('text-slate-500');
          el.classList.add('text-green-400');
        } else {
          el.classList.add('text-slate-500');
          el.classList.remove('text-green-400');
        }
      }
    });

    // Update bar
    const passedCount = Object.values(rules).filter(Boolean).length;
    bar.className = 'h-full transition-all duration-500';
    if (passedCount > 0 && passedCount <= 2) bar.classList.add('bg-red-500', 'w-1/4');
    else if (passedCount > 2 && passedCount <= 3) bar.classList.add('bg-amber-500', 'w-2/4');
    else if (passedCount === 4) bar.classList.add('bg-indigo-400', 'w-3/4');
    else if (passedCount === 5) bar.classList.add('bg-green-500', 'w-full');
    else bar.classList.add('w-0');
  });
}

// ─── Init ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  initPasswordWatcher();

  // Check for expired/notfound query params
  const params = new URLSearchParams(window.location.search);
  if (params.get('expired') === '1') {
    showToast('Este enlace ha expirado', 'error');
    window.history.replaceState({}, '', '/');
  }
  if (params.get('notfound') === '1') {
    showToast('Enlace no encontrado', 'error');
    window.history.replaceState({}, '', '/');
  }
});
