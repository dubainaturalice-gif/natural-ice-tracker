require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (creates tables + seeds)
require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productionRoutes = require('./routes/production');
const materialsRoutes = require('./routes/materials');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/materials', materialsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));

  // SPA catch-all
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
