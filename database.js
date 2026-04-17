const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shorten.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    last_ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
  CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
`);

const stmts = {
  createUser: db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?'),
  createUrl: db.prepare('INSERT INTO urls (user_id, short_code, original_url, expires_at) VALUES (?, ?, ?, ?)'),
  getUrlByCode: db.prepare('SELECT * FROM urls WHERE short_code = ?'),
  getUrlsByUser: db.prepare('SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC'),
  incrementClicks: db.prepare('UPDATE urls SET clicks = clicks + 1 WHERE id = ?'),
  deleteUrl: db.prepare('DELETE FROM urls WHERE id = ?'),
  getUserStats: db.prepare(`
    SELECT
      COUNT(*) as totalLinks,
      COALESCE(SUM(clicks), 0) as totalClicks,
      COUNT(CASE
        WHEN expires_at IS NULL THEN 1
        WHEN expires_at > datetime('now') THEN 1
      END) as activeLinks
    FROM urls WHERE user_id = ?
  `),
  updateUserIP: db.prepare('UPDATE users SET last_ip = ? WHERE id = ?'),
};

module.exports = {
  createUser(name, email, hash) {
    const info = stmts.createUser.run(name, email, hash);
    return { id: info.lastInsertRowid, name, email };
  },

  getUserByEmail(email) {
    return stmts.getUserByEmail.get(email);
  },

  getUserById(id) {
    return stmts.getUserById.get(id);
  },

  createUrl(userId, shortCode, originalUrl, expiresAt) {
    stmts.createUrl.run(userId, shortCode, originalUrl, expiresAt);
    return stmts.getUrlByCode.get(shortCode);
  },

  getUrlByCode(code) {
    return stmts.getUrlByCode.get(code);
  },

  getUrlsByUser(userId) {
    return stmts.getUrlsByUser.all(userId);
  },

  incrementClicks(id) {
    stmts.incrementClicks.run(id);
  },

  deleteUrl(id) {
    stmts.deleteUrl.run(id);
  },

  getUserStats(userId) {
    return stmts.getUserStats.get(userId);
  },

  updateUserIP(userId, ip) {
    stmts.updateUserIP.run(ip, userId);
  },
};
