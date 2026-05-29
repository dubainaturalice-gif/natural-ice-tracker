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
    'SELECT product, hour, quantity FROM production WHERE date = ? AND shift = ? AND team = ?'
  ).all(date, shift, Number(team));
  res.json(rows);
});

router.post('/', (req, res) => {
  const { date, shift, team, entries } = req.body;
  if (!date || !shift || !team || !entries) {
    return res.status(400).json({ error: 'date, shift, team, and entries are required' });
  }

  const upsert = db.prepare(`
    INSERT INTO production (date, shift, team, product, hour, quantity)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date, shift, team, product, hour)
    DO UPDATE SET quantity = excluded.quantity
  `);

  const insertMany = db.transaction((items) => {
    for (const entry of items) {
      upsert.run(date, shift, Number(team), entry.product, entry.hour, entry.quantity || 0);
    }
  });

  try {
    insertMany(entries);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save production data' });
  }
});

router.get('/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }
  const rows = db.prepare(
    `SELECT date, shift, team, product, SUM(quantity) as total
     FROM production
     WHERE date >= ? AND date <= ?
     GROUP BY date, shift, team, product`
  ).all(startDate, endDate);
  res.json(rows);
});

router.get('/stats', (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }
  const morning = db.prepare(
    "SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE date = ? AND shift = 'M'"
  ).get(date);
  const night = db.prepare(
    "SELECT COALESCE(SUM(quantity), 0) as total FROM production WHERE date = ? AND shift = 'N'"
  ).get(date);
  res.json({
    morningTotal: morning.total,
    nightTotal: night.total,
  });
});

module.exports = router;
