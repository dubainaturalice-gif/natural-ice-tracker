const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Use data directory for persistent storage
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'factory.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS factory_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    team INTEGER,
    shift TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    shift TEXT NOT NULL,
    team INTEGER NOT NULL,
    product TEXT NOT NULL,
    hour TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE(date, shift, team, product, hour)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    shift TEXT NOT NULL,
    team INTEGER NOT NULL,
    material TEXT NOT NULL,
    initial_stock INTEGER NOT NULL DEFAULT 0,
    using_qty INTEGER NOT NULL DEFAULT 0,
    UNIQUE(date, shift, team, material)
  )
`);

// Seed default users if none exist
const count = db.prepare('SELECT COUNT(*) as cnt FROM factory_users').get();
if (count.cnt === 0) {
  const insert = db.prepare(
    'INSERT INTO factory_users (username, name, password, role, team, shift) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const seedUsers = [
    ['admin', 'Administrator', 'admin123', 'admin', null, null],
    ['manager1', 'Factory Manager', 'manager123', 'manager', null, null],
    ['team1_morning', 'Production Team 1 Morning', 'worker123', 'worker', 1, 'M'],
    ['team1_night', 'Production Team 1 Night', 'worker123', 'worker', 1, 'N'],
    ['team2_morning', 'Cutting Team 2 Morning', 'worker123', 'worker', 2, 'M'],
    ['team2_night', 'Cutting Team 2 Night', 'worker123', 'worker', 2, 'N'],
  ];

  const insertMany = db.transaction((users) => {
    for (const u of users) {
      const hashed = bcrypt.hashSync(u[3] === 'admin' ? 'admin123' : u[3] === 'manager' ? 'manager123' : 'worker123', 10);
      insert.run(u[0], u[1], hashed, u[3], u[4], u[5]);
    }
  });

  insertMany(seedUsers);
  console.log('Default users seeded.');
}

module.exports = db;
