const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const { date, shift, team } = req.query;
  if (!date || !shift || !team) {
    return res.status(400).json({ error: 'date, shift, and team are required' });
  }
  const rows = db.prepare(
    'SELECT material, initial_stock, using_qty FROM materials WHERE date = ? AND shift = ? AND team = ?'
  ).all(date, shift, Number(team));
  res.json(rows);
});

router.get('/prev', (req, res) => {
  const { date, shift, team } = req.query;
  if (!date || !shift || !team) {
    return res.status(400).json({ error: 'date, shift, and team are required' });
  }

  // Calculate previous shift
  let prevDate, prevShift;
  if (shift === 'N') {
    prevDate = date;
    prevShift = 'M';
  } else {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    prevDate = d.toISOString().slice(0, 10);
    prevShift = 'N';
  }

  const rows = db.prepare(
    'SELECT material, initial_stock, using_qty FROM materials WHERE date = ? AND shift = ? AND team = ?'
  ).all(prevDate, prevShift, Number(team));
  res.json(rows);
});

router.post('/', (req, res) => {
  const { date, shift, team, entries } = req.body;
  if (!date || !shift || !team || !entries) {
    return res.status(400).json({ error: 'date, shift, team, and entries are required' });
  }

  const upsert = db.prepare(`
    INSERT INTO materials (date, shift, team, material, initial_stock, using_qty)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date, shift, team, material)
    DO UPDATE SET initial_stock = excluded.initial_stock, using_qty = excluded.using_qty
  `);

  const insertMany = db.transaction((items) => {
    for (const entry of items) {
      upsert.run(date, shift, Number(team), entry.material, entry.initial_stock || 0, entry.using_qty || 0);
    }
  });

  try {
    insertMany(entries);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save materials data' });
  }
});

module.exports = router;
