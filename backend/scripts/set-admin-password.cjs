const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const password = process.argv[2];
const dbPath = process.argv[3] || 'public/data/security.sqlite';

if (!password) {
  console.error('Usage: node scripts/set-admin-password.cjs <password> [security-db-path]');
  process.exit(1);
}

if (!/^\d{6}$/.test(password)) {
  console.error('Admin password must be exactly six digits.');
  process.exit(1);
}

const db = new Database(dbPath);
const hash = bcrypt.hashSync(password, 12);
const now = new Date().toISOString();
const existing = db.prepare('select id from passwords where type = ?').get('default');

if (existing) {
  db.prepare(
    'update passwords set password = ?, isDefault = 1, lastModified = ?, updatedAt = ? where type = ?'
  ).run(hash, now, now, 'default');
} else {
  db.prepare(
    'insert into passwords (type, password, isDefault, lastModified, createdAt, updatedAt) values (?, ?, ?, ?, ?, ?)'
  ).run('default', hash, 1, now, now, now);
}

db.close();
console.log('Admin password reset successfully.');
