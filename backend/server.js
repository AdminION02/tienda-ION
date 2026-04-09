// ─── 1. Fix IPv4 (debe ir PRIMERO, antes de todo) ───────────────────
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// ─── 2. Variables de entorno ─────────────────────────────────────────
require('dotenv').config();

// ─── 3. Imports ──────────────────────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const pool    = require('./db');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes   = require('./routes/orders');

// ─── 4. App & Middleware ─────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: [
    'https://tienda-ion.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// ─── 5. Rutas ────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// ─── 6. Verificar conexión DB ────────────────────────────────────────
pool.query('SELECT NOW()')
  .then(res  => console.log('✅ Conectado a Supabase:', res.rows[0]))
  .catch(err => console.error('❌ Error conectando a Supabase:', err.message));

// ─── 7. Iniciar servidor ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});