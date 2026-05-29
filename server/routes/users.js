const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All user routes require admin
router.use(authRequired, adminOnly);

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, team, shift FROM factory_users ORDER BY id').all();
  res.json(users);
});

router.post('/', (req, res) => {
  const { username, name, password, role, team, shift } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: 'Username, name, and password are required' });
  }

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const teamVal = role === 'worker' ? (team || null) : null;
    const shiftVal = role === 'worker' ? (shift || null) : null;

    const result = db.prepare(
      'INSERT INTO factory_users (username, name, password, role, team, shift) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, name, hashed, role || 'worker', teamVal, shiftVal);

    res.json({
      id: result.lastInsertRowid,
      username, name, role: role || 'worker', team: teamVal, shift: shiftVal,
    });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { username, name, password, role, team, shift } = req.body;

  if (!username || !name || !password) {
    return res.status(400).json({ error: 'Username, name, and password are required' });
  }

  try {
    const hashed = bcrypt.hashSync(password, 10);
    const teamVal = role === 'worker' ? (team || null) : null;
    const shiftVal = role === 'worker' ? (shift || null) : null;

    db.prepare(
      'UPDATE factory_users SET username = ?, name = ?, password = ?, role = ?, team = ?, shift = ? WHERE id = ?'
    ).run(username, name, hashed, role || 'worker', teamVal, shiftVal, id);

    res.json({ id: Number(id), username, name, role: role || 'worker', team: teamVal, shift: shiftVal });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const user = db.prepare('SELECT * FROM factory_users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.username === 'admin') {
    return res.status(400).json({ error: 'Cannot delete admin user' });
  }

  db.prepare('DELETE FROM factory_users WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;
