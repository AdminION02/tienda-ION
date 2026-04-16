const express = require('express');
const pool = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/products
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
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
});

// POST /api/products (solo admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      name, description, price, category, stock, featured,
      image, image2, image3, image4, image5,          // ← todas las imágenes
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Nombre, precio y categoría son obligatorios' });
    }

    const result = await pool.query(
      `INSERT INTO products
         (name, description, price, category, stock, featured,
          image, image2, image3, image4, image5)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        name,
        description   || '',
        Number(price),
        category,
        Number(stock) || 0,
        featured      || false,
        image         || '',
        image2        || '',
        image3        || '',
        image4        || '',
        image5        || '',
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear producto', error: error.message });
  }
});

// PUT /api/products/:id (solo admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const {
      name, description, price, category, stock, featured,
      image, image2, image3, image4, image5,          // ← todas las imágenes
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Nombre, precio y categoría son obligatorios' });
    }

    const result = await pool.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, category=$4,
           stock=$5, featured=$6,
           image=$7, image2=$8, image3=$9, image4=$10, image5=$11
       WHERE id = $12
       RETURNING *`,
      [
        name,
        description   || '',
        Number(price),
        category,
        Number(stock) || 0,
        featured      || false,
        image         || '',
        image2        || '',
        image3        || '',
        image4        || '',
        image5        || '',
        req.params.id,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// DELETE /api/products/:id (solo admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

module.exports = router;