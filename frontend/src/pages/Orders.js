import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

// ── Soporta tanto claves en español (legacy) como en inglés (Supabase) ──
const STATUS_LABELS = {
  // Inglés — valores que guarda Supabase / panel admin
  pending:   { label: '⏳ Pendiente',  color: '#f5a623' },
  confirmed: { label: '✅ Confirmado', color: '#25D366' },
  shipped:   { label: '🚚 Enviado',    color: '#4fc3f7' },
  delivered: { label: '📦 Entregado',  color: '#81c784' },
  cancelled: { label: '❌ Cancelado',  color: '#e94560' },

  // Español — por compatibilidad con datos anteriores
  pendiente:  { label: '⏳ Pendiente',  color: '#f5a623' },
  confirmado: { label: '✅ Confirmado', color: '#25D366' },
  enviado:    { label: '🚚 Enviado',    color: '#4fc3f7' },
  entregado:  { label: '📦 Entregado',  color: '#81c784' },
  cancelado:  { label: '❌ Cancelado',  color: '#e94560' },
};

const DEFAULT_STATUS = { label: '⏳ Pendiente', color: '#f5a623' };

const formatPrice = (p) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(p ?? 0);

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return '—'; }
};

const getId = (obj) => obj?._id ?? obj?.id ?? null;

const parseField = (field) => {
  if (!field) return field;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return field; }
  }
  return field;
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
        let data = res?.data ?? res ?? [];
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          data = data.orders ?? data.data ?? data.pedidos ?? [];
        }
        const list = Array.isArray(data) ? data : [];
        console.log(`[Orders] ${list.length} pedidos`, list[0]);
        setOrders(list);
      })
      .catch((err) => {
        console.error('[Orders] Error:', err);
        setError('No pudimos cargar tus pedidos. Intenta de nuevo.');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  if (error) return (
    <div className="orders-page container">
      <div className="empty-state">
        <p style={{ fontSize: 56 }}>⚠️</p>
        <h3>Algo salió mal</h3>
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }}
          onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    </div>
  );

  if (orders.length === 0) return (
    <div className="orders-page container">
      <div className="page-header">
        <h1>Mis <span className="text-accent">Pedidos</span></h1>
        <p>Historial de todas tus compras</p>
      </div>
      <div className="empty-state">
        <p style={{ fontSize: 56 }}>📦</p>
        <h3>Aún no tienes pedidos</h3>
        <p>¡Haz tu primera compra ahora!</p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
          Ver Productos
        </Link>
      </div>
    </div>
  );

  return (
    <div className="orders-page container">
      <div className="page-header">
        <h1>Mis <span className="text-accent">Pedidos</span></h1>
        <p>{orders.length} {orders.length === 1 ? 'compra registrada' : 'compras registradas'}</p>
      </div>

      <div className="orders-list">
        {orders.map((order, idx) => {
          const orderId = getId(order);
          if (!order || !orderId) return null;

          // ← FIX: busca el status en inglés o español, con fallback seguro
          const status  = STATUS_LABELS[order.status] ?? DEFAULT_STATUS;
          const items   = Array.isArray(parseField(order.items)) ? parseField(order.items) : [];
          const total   = order.total ?? order.totalAmount ?? order.price ?? 0;
          const shortId = String(orderId).slice(-6).toUpperCase();
          const waNumber = process.env.REACT_APP_WHATSAPP_NUMBER || '573202262501';

          const itemsList = items
            .map(i => `• ${i?.quantity ?? 1}x ${i?.name ?? 'Producto'} - $${(i?.price ?? 0).toLocaleString('es-CO')}`)
            .join('\n');

          const waMessage =
            `🛍️ *Consulta Pedido #${shortId}*\n\n` +
            `📦 *Productos:*\n${itemsList || 'Sin detalle'}\n\n` +
            `💰 *Total: $${total.toLocaleString('es-CO')} COP*\n\n` +
            `Hola, quisiera saber el estado de mi pedido.`;

          const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
          const dateField = order.created_at ?? order.createdAt ?? order.date;

          return (
            <div key={orderId ?? idx} className="order-card card fade-in">

              <div className="order-header">
                <div className="order-header-left">
                  <span className="order-id">Pedido #{shortId}</span>
                  <span className="order-date">{formatDate(dateField)}</span>
                </div>
                <span className="order-status-badge" style={{ '--status-color': status.color }}>
                  {status.label}
                </span>
              </div>

              <div className="order-items">
                {items.length === 0 ? (
                  <p className="order-item-empty">Sin productos registrados</p>
                ) : (
                  items.map((item, i) => {
                    if (!item) return null;
                    const name   = item.name ?? item.productName ?? 'Producto';
                    const price  = item.price ?? item.unitPrice ?? 0;
                    const qty    = item.quantity ?? 1;
                    const imgSrc = item.image ?? item.imageUrl ?? item.img ?? null;

                    return (
                      <div key={getId(item) ?? `${orderId}-${i}`} className="order-item">
                        {imgSrc && (
                          <img src={imgSrc} alt={name} className="order-item-img"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                        <div className="order-item-info">
                          <p className="order-item-name">{name}</p>
                          <p className="order-item-qty">{qty} × {formatPrice(price)}</p>
                        </div>
                        <span className="order-item-total">{formatPrice(price * qty)}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="order-footer">
                <span className="order-total">
                  Total: <strong className="price">{formatPrice(total)}</strong>
                </span>
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="btn btn-whatsapp order-wa-btn">
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