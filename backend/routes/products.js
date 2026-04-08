const express = require('express');
const pool = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let i = 1;

    if (category && category !== 'all') {
      query += ` AND category = $${i++}`;
      params.push(category);
    }
    if (featured === 'true') {
      query += ` AND featured = $${i++}`;
      params.push(true);
    }
    if (search) {
      query += ` AND (name ILIKE $${i} OR description ILIKE $${i++})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
});

// POST /api/products (solo admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, price, image, category, stock, featured } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, description, price, image, category, stock, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, price, image, category, stock, featured || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear producto', error: error.message });
  }
});

// PUT /api/products/:id (solo admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, price, image, category, stock, featured } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, image=$4,
       category=$5, stock=$6, featured=$7 WHERE id=$8 RETURNING *`,
      [name, description, price, image, category, stock, featured, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// DELETE /api/products/:id (solo admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

module.exports = router;