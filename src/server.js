const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const db = require('./database');
const { requireAuth, optionalAuth, JWT_SECRET } = require('./auth-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ─── Middleware ───────────────────────────────────────────

// Helmet: Security headers
app.use(helmet({
  contentSecurityPolicy: false, 
}));

// Static files (Served BEFORE rate limiting to avoid blocking UI assets)
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());

// ─── Rate Limiting ──────────────────────────────────────────

// General API Limiter: 60 requests per minute
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Auth Limiter: 10 requests per minute for login/register
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Por seguridad, espera un minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter to all /api routes
app.use('/api', apiLimiter);

// Apply strict limiter ONLY to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Auth Routes ────────────────────────────────────────────



app.post('/api/auth/register', async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Sanitize and Validate
    name = validator.escape(name).trim();
    email = validator.normalizeEmail(email);

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({ error: 'La contraseña debe incluir mayúscula, minúscula, número y símbolo' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = db.createUser(name, email, hash);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    email = validator.normalizeEmail(email);

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const currentIP = req.ip;
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Update last login IP
    db.updateUserIP(user.id, currentIP);

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// ─── URL Routes ─────────────────────────────────────────────

app.post('/api/shorten', optionalAuth, async (req, res) => {
  try {
    const { url, expiresIn } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'La URL es requerida' });
    }

    if (!validator.isURL(url, { require_protocol: true })) {
      return res.status(400).json({ error: 'URL inválida. Asegúrate de incluir http:// o https://' });
    }

    const shortCode = nanoid(7);
    const userId = req.user ? req.user.id : null;
    let expiresAt = null;

    if (expiresIn && parseFloat(expiresIn) > 0) {
      const days = parseFloat(expiresIn);
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const entry = db.createUrl(userId, shortCode, url, expiresAt);

    // Generate QR code
    const shortUrl = `${BASE_URL}/${entry.short_code}`;
    const qr = await QRCode.toDataURL(shortUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#1a73e8', light: '#ffffff' }
    });

    res.json({
      shortCode: entry.short_code,
      shortUrl,
      originalUrl: entry.original_url,
      createdAt: entry.created_at,
      expiresAt: entry.expires_at,
      qr
    });
  } catch (err) {
    console.error('Shorten error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/urls', requireAuth, (req, res) => {
  try {
    const urls = db.getUrlsByUser(req.user.id);
    const result = urls.map(u => ({
      id: u.id,
      shortCode: u.short_code,
      shortUrl: `${BASE_URL}/${u.short_code}`,
      originalUrl: u.original_url,
      clicks: u.clicks,
      createdAt: u.created_at,
      expiresAt: u.expires_at,
      isExpired: u.expires_at ? new Date(u.expires_at) < new Date() : false
    }));
    res.json(result);
  } catch (err) {
    console.error('Get URLs error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/urls/:code/qr', async (req, res) => {
  try {
    const url = db.getUrlByCode(req.params.code);
    if (!url) return res.status(404).json({ error: 'Enlace no encontrado' });

    const shortUrl = `${BASE_URL}/${url.short_code}`;
    const qr = await QRCode.toDataURL(shortUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#1a73e8', light: '#ffffff' }
    });

    res.json({ qr, shortUrl });
  } catch (err) {
    console.error('QR error:', err);
    res.status(500).json({ error: 'Error al generar QR' });
  }
});

app.delete('/api/urls/:code', requireAuth, (req, res) => {
  try {
    const url = db.getUrlByCode(req.params.code);
    if (!url) return res.status(404).json({ error: 'Enlace no encontrado' });
    if (url.user_id !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    db.deleteUrl(url.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const stats = db.getUserStats(req.user.id);
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── Dashboard Route ────────────────────────────────────────

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ─── Redirect Route (MUST be last) ─────────────────────────

app.get('/:code', (req, res) => {
  // Skip favicon and common static file requests
  if (req.params.code === 'favicon.ico') return res.status(204).end();

  const url = db.getUrlByCode(req.params.code);
  if (!url) {
    return res.redirect('/?notfound=1');
  }

  if (url.expires_at && new Date(url.expires_at) < new Date()) {
    return res.redirect('/?expired=1');
  }

  db.incrementClicks(url.id);
  res.redirect(302, url.original_url);
});

// ─── Start Server ───────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🔗 Corntex running on ${BASE_URL}\n`);
});
