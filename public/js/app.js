// ═══════════════════════════════════════════════════════════
// corntex — Landing Page Logic
// ═══════════════════════════════════════════════════════════

// ─── Shorten URL ────────────────────────────────────────────

async function shortenUrl() {
  const input = document.getElementById('urlInput');
  const btn = document.getElementById('shortenBtn');
  const expirationSelect = document.getElementById('expirationSelect');
  const url = input.value.trim();

  if (!url) {
    input.focus();
    showToast('Ingresa una URL para acortar', 'error');
    return;
  }

  // Basic URL validation
  if (!url.match(/^https?:\/\/.+/i)) {
    if (url.match(/^[\w.-]+\.\w{2,}/)) {
      input.value = 'https://' + url;
    } else {
      showToast('Ingresa una URL válida (ej: https://ejemplo.com)', 'error');
      return;
    }
  }

  const finalUrl = input.value.trim();
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
      body: JSON.stringify({ url: finalUrl, expiresIn }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Error al acortar la URL', 'error');
      return;
    }

    // Show result
    showResult(data);
    input.value = '';
    showToast('¡Enlace acortado!', 'success');

  } catch (err) {
    showToast('Error de conexión. Intenta de nuevo.', 'error');
  } finally {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    btn.disabled = false;
  }
}

// ─── Show Result ────────────────────────────────────────────

function showResult(data) {
  const panel = document.getElementById('resultPanel');
  const urlLink = document.getElementById('shortUrlLink');
  const qrImage = document.getElementById('qrImage');
  const expiryEl = document.getElementById('resultExpiry');
  const resultHint = document.getElementById('resultHint');

  urlLink.href = data.shortUrl;
  urlLink.textContent = data.shortUrl.replace(/^https?:\/\//, '');

  if (data.qr) {
    qrImage.src = data.qr;
  }

  if (data.expiresAt) {
    const expDate = new Date(data.expiresAt);
    expiryEl.textContent = '⏰ Expira: ' + formatDate(expDate);
    expiryEl.classList.remove('hidden');
  } else {
    expiryEl.textContent = '♾️ Sin expiración';
  }

  if (resultHint) {
    resultHint.classList.toggle('hidden', isLoggedIn());
  }

  panel.classList.remove('hidden');

  // Scroll to result
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Copy Short URL ─────────────────────────────────────────

async function copyShortUrl() {
  const urlLink = document.getElementById('shortUrlLink');
  const btn = document.getElementById('copyBtn');

  try {
    await navigator.clipboard.writeText(urlLink.href);
    
    // Tailwind visual feedback
    const originalContent = btn.innerHTML;
    btn.innerHTML = `
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>¡Copiado!</span>
    `;
    btn.classList.remove('bg-indigo-500', 'hover:bg-indigo-400');
    btn.classList.add('bg-green-500', 'hover:bg-green-400');
    
    showToast('Enlace copiado al portapapeles', 'success');

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.classList.add('bg-indigo-500', 'hover:bg-indigo-400');
      btn.classList.remove('bg-green-500', 'hover:bg-green-400');
    }, 2000);
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = urlLink.href;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Enlace copiado', 'success');
  }
}

// ─── Format Date ────────────────────────────────────────────

function formatDate(date) {
  const now = new Date();
  const diff = date - now;

  if (diff < 0) return 'Expirado';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `en ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `en ${hours} hora${hours > 1 ? 's' : ''}`;
  return 'pronto';
}

// ─── Enter key to submit ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('urlInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        shortenUrl();
      }
    });
  }
});
