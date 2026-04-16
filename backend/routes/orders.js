const express = require('express');
const pool = require('../db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - Crear orden
router.post('/', protect, async (req, res) => {
  try {
    const { items, total, customerInfo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    const info = customerInfo || { name: req.user.name, email: req.user.email };

    const result = await pool.query(
      `INSERT INTO orders (user_id, items, total, customer_info, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [req.user.id, JSON.stringify(items), total, JSON.stringify(info)]
    );

    const order = result.rows[0];

    const whatsappNumber = process.env.WHATSAPP_NUMBER || '573202262501';
    const whatsappLink = generateWhatsAppLink(whatsappNumber, order);

    res.status(201).json({ order, whatsappLink });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear orden', error: error.message });
  }
});

// GET /api/orders/my - Mis órdenes
router.get('/my', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: error.message });
  }
});

// GET /api/orders - Todas las órdenes (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: error.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [req.body.status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar orden', error: error.message });
  }
});

// Función para generar enlace WhatsApp
function generateWhatsAppLink(number, order) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const info = typeof order.customer_info === 'string' ? JSON.parse(order.customer_info) : order.customer_info;

  const itemsList = items
    .map(item => `• ${item.quantity}x ${item.name} - $${item.price.toLocaleString('es-CO')}`)
    .join('\n');

  const orderId = order.id.toString().slice(-6).toUpperCase();

  const message =
    `🛍️ *NUEVO PEDIDO #${orderId}*\n\n` +
    `👤 *Cliente:* ${info?.name || 'No especificado'}\n` +
    `📧 *Email:* ${info?.email || 'No especificado'}\n\n` +
    `📦 *Productos:*\n${itemsList}\n\n` +
    `💰 *TOTAL: $${order.total.toLocaleString('es-CO')} COP*\n\n` +
    `¡Hola! Acabo de realizar este pedido y quisiera confirmar mi compra. ✅`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

module.exports = router;