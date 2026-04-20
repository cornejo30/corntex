const Database = require('better-sqlite3');
const db = new Database('shorten.db');
const users = db.prepare('SELECT id, email, name FROM users').all();
console.log(JSON.stringify(users, null, 2));
