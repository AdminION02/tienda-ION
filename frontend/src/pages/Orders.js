import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

const STATUS_LABELS = {
  pendiente: { label: '⏳ Pendiente', color: '#f5a623' },
  confirmado: { label: '✅ Confirmado', color: '#25D366' },
  enviado: { label: '🚚 Enviado', color: '#4fc3f7' },
  entregado: { label: '📦 Entregado', color: '#81c784' },
  cancelado: { label: '❌ Cancelado', color: '#e94560' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyOrders()
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div className="orders-page container">
      <div className="page-header">
        <h1>Mis <span className="text-accent">Pedidos</span></h1>
        <p>Historial de todas tus compras</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: 64 }}>📦</p>
          <h3>Aún no tienes pedidos</h3>
          <p>¡Haz tu primer compra ahora!</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
            Ver Productos
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const status = STATUS_LABELS[order.status] || STATUS_LABELS.pendiente;
            const waNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '573001234567';
            const itemsList = order.items.map(i => `• ${i.quantity}x ${i.name} - $${i.price.toLocaleString('es-CO')}`).join('\n');
            const waMessage = `🛍️ *Consulta Pedido #${order._id.slice(-6).toUpperCase()}*\n\n📦 *Productos:*\n${itemsList}\n\n💰 *Total: $${order.total.toLocaleString('es-CO')} COP*\n\nHola, quisiera saber el estado de mi pedido.`;
            const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

            return (
              <div key={order._id} className="order-card card">
                <div className="order-header">
                  <div>
                    <span className="order-id">Pedido #{order._id.slice(-6).toUpperCase()}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className="order-status" style={{ color: status.color }}>
                    {status.label}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map((item, i) => (
                    <div key={i} className="order-item">
                      {item.image && <img src={item.image} alt={item.name} className="order-item-img" />}
                      <div>
                        <p className="order-item-name">{item.name}</p>
                        <p className="order-item-qty">Cantidad: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <span className="order-item-total">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <span className="order-total">Total: <strong className="price">{formatPrice(order.total)}</strong></span>
                  <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-whatsapp order-wa-btn">
                    💬 Consultar estado
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
