import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

const STATUS_LABELS = {
  pendiente:  { label: '⏳ Pendiente',  color: '#f5a623' },
  confirmado: { label: '✅ Confirmado', color: '#25D366' },
  enviado:    { label: '🚚 Enviado',    color: '#4fc3f7' },
  entregado:  { label: '📦 Entregado',  color: '#81c784' },
  cancelado:  { label: '❌ Cancelado',  color: '#e94560' },
};

const formatPrice = (p) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(p ?? 0);

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '—';
  }
};

export default function Orders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { user }              = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    getMyOrders()
      .then(res => {
        // Acepta tanto res.data (axios) como res directamente
        const data = res?.data ?? res ?? [];
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error al cargar pedidos:', err);
        setError('No pudimos cargar tus pedidos. Intenta de nuevo.');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="orders-page container">
        <div className="empty-state">
          <p style={{ fontSize: 64 }}>⚠️</p>
          <h3>Algo salió mal</h3>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  /* ── Sin pedidos ── */
  if (orders.length === 0) {
    return (
      <div className="orders-page container">
        <div className="page-header">
          <h1>Mis <span className="text-accent">Pedidos</span></h1>
          <p>Historial de todas tus compras</p>
        </div>
        <div className="empty-state">
          <p style={{ fontSize: 64 }}>📦</p>
          <h3>Aún no tienes pedidos</h3>
          <p>¡Haz tu primera compra ahora!</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
            Ver Productos
          </Link>
        </div>
      </div>
    );
  }

  /* ── Lista de pedidos ── */
  return (
    <div className="orders-page container">
      <div className="page-header">
        <h1>Mis <span className="text-accent">Pedidos</span></h1>
        <p>Historial de todas tus compras</p>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          // Protección: si el pedido está malformado, no crashear
          if (!order || !order._id) return null;

          const status   = STATUS_LABELS[order.status] ?? STATUS_LABELS.pendiente;
          const items    = Array.isArray(order.items) ? order.items : [];
          const total    = order.total ?? 0;
          const orderId  = order._id.slice(-6).toUpperCase();
          const waNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '573001234567';

          const itemsList = items
            .map(i => `• ${i?.quantity ?? 1}x ${i?.name ?? 'Producto'} - $${(i?.price ?? 0).toLocaleString('es-CO')}`)
            .join('\n');

          const waMessage =
            `🛍️ *Consulta Pedido #${orderId}*\n\n` +
            `📦 *Productos:*\n${itemsList || 'Sin detalle'}\n\n` +
            `💰 *Total: $${total.toLocaleString('es-CO')} COP*\n\n` +
            `Hola, quisiera saber el estado de mi pedido.`;

          const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

          return (
            <div key={order._id} className="order-card card">

              {/* Encabezado */}
              <div className="order-header">
                <div>
                  <span className="order-id">Pedido #{orderId}</span>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <span className="order-status" style={{ color: status.color }}>
                  {status.label}
                </span>
              </div>

              {/* Ítems */}
              <div className="order-items">
                {items.length === 0 ? (
                  <p className="order-item-empty">Sin productos registrados</p>
                ) : (
                  items.map((item, i) => {
                    if (!item) return null;
                    const itemPrice = item.price ?? 0;
                    const itemQty   = item.quantity ?? 1;
                    return (
                      <div key={item._id ?? i} className="order-item">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name ?? 'Producto'}
                            className="order-item-img"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="order-item-info">
                          <p className="order-item-name">{item.name ?? 'Producto'}</p>
                          <p className="order-item-qty">
                            {itemQty} × {formatPrice(itemPrice)}
                          </p>
                        </div>
                        <span className="order-item-total">
                          {formatPrice(itemPrice * itemQty)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pie */}
              <div className="order-footer">
                <span className="order-total">
                  Total: <strong className="price">{formatPrice(total)}</strong>
                </span>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-whatsapp order-wa-btn"
                >
                  💬 Consultar estado
                </a>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}