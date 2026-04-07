const express = require('express');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders - Crear orden
router.post('/', protect, async (req, res) => {
  try {
    const { items, total, customerInfo } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      total,
      customerInfo: customerInfo || {
        name: req.user.name,
        email: req.user.email
      }
    });

    // Generar enlace de WhatsApp
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '573001234567';
    const whatsappLink = generateWhatsAppLink(whatsappNumber, order);

    res.status(201).json({
      order,
      whatsappLink
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear orden', error: error.message });
  }
});

// GET /api/orders/my - Mis órdenes
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: error.message });
  }
});

// GET /api/orders - Todas las órdenes (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes', error: error.message });
  }
});

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar orden', error: error.message });
  }
});

// Función para generar enlace WhatsApp
function generateWhatsAppLink(number, order) {
  const itemsList = order.items
    .map(item => `• ${item.quantity}x ${item.name} - $${item.price.toLocaleString('es-CO')}`)
    .join('\n');

  const message = `🛍️ *NUEVO PEDIDO #${order._id.toString().slice(-6).toUpperCase()}*\n\n` +
    `👤 *Cliente:* ${order.customerInfo?.name || 'No especificado'}\n` +
    `📧 *Email:* ${order.customerInfo?.email || 'No especificado'}\n\n` +
    `📦 *Productos:*\n${itemsList}\n\n` +
    `💰 *TOTAL: $${order.total.toLocaleString('es-CO')} COP*\n\n` +
    `¡Hola! Acabo de realizar este pedido y quisiera confirmar mi compra. ✅`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

module.exports = router;
