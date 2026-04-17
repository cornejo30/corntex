// ═══════════════════════════════════════════════════════════
// corntex — Dashboard Logic
// ═══════════════════════════════════════════════════════════

let deleteTargetCode = null;

// ─── Init Dashboard ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!isLoggedIn()) {
    window.location.href = '/?login=1';
    return;
  }

  const user = getUser();
  const dashUserName = document.getElementById('dashUserName');
  if (dashUserName && user) {
    dashUserName.textContent = user.name;
  }

  loadDashboard();

  // Enter key for dashboard shortener
  const input = document.getElementById('dashUrlInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        dashShortenUrl();
      }
    });
  }
});

// ─── Load Dashboard Data ────────────────────────────────────

async function loadDashboard() {
  await Promise.all([loadStats(), loadUrls()]);
}

// ─── Load Stats ─────────────────────────────────────────────

async function loadStats() {
  try {
    const res = await fetch('/api/stats', { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) return handleAuthExpired();
      return;
    }
    const stats = await res.json();

    animateCounter('totalLinks', stats.totalLinks || 0);
    animateCounter('totalClicks', stats.totalClicks || 0);
    animateCounter('activeLinks', stats.activeLinks || 0);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// ─── Animate Counter ────────────────────────────────────────

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  const duration = 600;
  const start = parseInt(el.textContent) || 0;
  const increment = (target - start) / (duration / 16);
  let current = start;

  function step() {
    current += increment;
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      el.textContent = target.toLocaleString();
      return;
    }
    el.textContent = Math.round(current).toLocaleString();
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ─── Load URLs ──────────────────────────────────────────────

async function loadUrls() {
  try {
    const res = await fetch('/api/urls', { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) return handleAuthExpired();
      return;
    }
    const urls = await res.json();

    renderUrls(urls);
  } catch (err) {
    console.error('Error loading URLs:', err);
  }
}

// ─── Render URLs List ───────────────────────────────────────

function renderUrls(urls) {
  const list = document.getElementById('urlsList');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('urlsCount');

  if (!list) return;

  if (urls.length === 0) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    if (count) count.textContent = '';
    return;
  }

  if (empty) empty.classList.add('hidden');
  if (count) count.textContent = `${urls.length} enlace${urls.length !== 1 ? 's' : ''}`;

  list.innerHTML = urls.map((url, i) => `
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group animate-fade-in opacity-0" style="animation-delay: ${i * 0.05}s">
      <div class="flex-1 min-w-0 pr-4">
        <div class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 truncate opacity-70 group-hover:opacity-100 transition-opacity" title="${escapeHtml(url.originalUrl)}">
          ${escapeHtml(url.originalUrl)}
        </div>
        <a href="${escapeHtml(url.shortUrl)}" target="_blank" class="flex items-center gap-2 text-lg font-bold text-indigo-400 hover:text-indigo-300 transition-colors truncate">
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span class="truncate">${escapeHtml(url.shortUrl.replace(/^https?:\/\//, ''))}</span>
        </a>
        <div class="flex items-center gap-3 mt-3">
          <span class="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-green-500/20">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            ${url.clicks} clic${url.clicks !== 1 ? 's' : ''}
          </span>
          <span class="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/5">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${formatDateShort(url.createdAt)}
          </span>
          ${url.expiresAt ? `
            <span class="flex items-center gap-1.5 px-2.5 py-1 ${url.isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} text-[10px] font-bold uppercase tracking-wider rounded-lg border">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              ${url.isExpired ? 'Expirado' : 'Activo'}
            </span>
          ` : ''}
        </div>
      </div>
      <div class="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto">
        <button class="flex-1 md:flex-none p-2.5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Copiar enlace" onclick="copyUrlFromList('${escapeHtml(url.shortUrl)}')">
          <svg class="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button class="flex-1 md:flex-none p-2.5 bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 rounded-xl transition-all" title="Ver código QR" onclick="showQrModal('${url.shortCode}')">
          <svg class="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>
          </svg>
        </button>
        <button class="flex-1 md:flex-none p-2.5 bg-white/5 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-all" title="Eliminar enlace" onclick="showDeleteModal('${url.shortCode}')">
          <svg class="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ─── Dashboard Shorten URL ──────────────────────────────────

async function dashShortenUrl() {
  const input = document.getElementById('dashUrlInput');
  const btn = document.getElementById('dashShortenBtn');
  const expirationSelect = document.getElementById('dashExpirationSelect');
  let url = input.value.trim();

  if (!url) {
    input.focus();
    showToast('Ingresa una URL para acortar', 'error');
    return;
  }

  if (!url.match(/^https?:\/\//i)) {
    if (url.match(/^[\w.-]+\.\w{2,}/)) {
      url = 'https://' + url;
      input.value = url;
    } else {
      showToast('Ingresa una URL válida', 'error');
      return;
    }
  }

  const expiresIn = expirationSelect.value || null;

  // Show loading
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');
  btn.disabled = true;

  try {
    const res = await fetch('/api/shorten', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ url, expiresIn }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Error al acortar', 'error');
      return;
    }

    input.value = '';
    showToast('¡Enlace creado!', 'success');
    loadDashboard();

  } catch (err) {
    showToast('Error de conexión', 'error');
  } finally {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    btn.disabled = false;
  }
}

// ─── Copy URL from List ─────────────────────────────────────

async function copyUrlFromList(url) {
  try {
    await navigator.clipboard.writeText(url);
    showToast('Enlace copiado', 'success');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Enlace copiado', 'success');
  }
}

// ─── QR Modal ───────────────────────────────────────────────

async function showQrModal(code) {
  const modal = document.getElementById('qrModal');
  const img = document.getElementById('qrModalImage');
  const urlText = document.getElementById('qrModalUrl');

  if (!modal) return;

  try {
    const res = await fetch(`/api/urls/${code}/qr`);
    const data = await res.json();

    if (!res.ok) {
      showToast('Error al generar QR', 'error');
      return;
    }

    img.src = data.qr;
    urlText.textContent = data.shortUrl.replace(/^https?:\/\//, '');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    showToast('Error de conexión', 'error');
  }
}

function closeQrModal() {
  const modal = document.getElementById('qrModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function downloadQr() {
  const img = document.getElementById('qrModalImage');
  if (!img || !img.src) return;

  const a = document.createElement('a');
  a.href = img.src;
  a.download = 'qr-code.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('QR descargado', 'success');
}

// ─── Delete Modal ───────────────────────────────────────────

function showDeleteModal(code) {
  deleteTargetCode = code;
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeDeleteModal() {
  deleteTargetCode = null;
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

async function confirmDelete() {
  if (!deleteTargetCode) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Eliminando...';

  try {
    const res = await fetch(`/api/urls/${deleteTargetCode}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || 'Error al eliminar', 'error');
      return;
    }

    closeDeleteModal();
    showToast('Enlace eliminado', 'success');
    loadDashboard();

  } catch (err) {
    showToast('Error de conexión', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Eliminar';
  }
}

// ─── Handle Auth Expired ────────────────────────────────────

function handleAuthExpired() {
  clearToken();
  window.location.href = '/?login=1';
}

// ─── Utilities ──────────────────────────────────────────────

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

// ─── Modal close on overlay click ───────────────────────────

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    const qrModal = document.getElementById('qrModal');
    const deleteModal = document.getElementById('deleteModal');
    if (qrModal && !qrModal.classList.contains('hidden')) closeQrModal();
    if (deleteModal && !deleteModal.classList.contains('hidden')) closeDeleteModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeQrModal();
    closeDeleteModal();
  }
});
