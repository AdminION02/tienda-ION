import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import './OrdersUdapte.css';

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pendiente',  emoji: '🕐' },
  { value: 'confirmed', label: 'Confirmado', emoji: '✅' },
  { value: 'shipped',   label: 'Enviado',    emoji: '🚚' },
  { value: 'delivered', label: 'Entregado',  emoji: '📦' },
  { value: 'cancelled', label: 'Cancelado',  emoji: '❌' },
];

const PERIOD_OPTIONS = [
  { value: 'day',   label: 'Hoy' },
  { value: 'week',  label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year',  label: 'Este año' },
  { value: 'all',   label: 'Todos' },
];

// ── Obtiene el ID sin importar si el backend usa _id o id ──
const getId = (obj) => obj?._id ?? obj?.id ?? null;

function getStatusInfo(status) {
  return STATUS_OPTIONS.find(s => s.value === status) || { label: status, emoji: '❓' };
}

function formatPrice(p) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(p ?? 0);
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function isInPeriod(dateStr, period) {
  if (period === 'all') return true;
  const date  = new Date(dateStr);
  const now   = new Date();
  const start = new Date(now);
  if      (period === 'day')   { start.setHours(0, 0, 0, 0); }
  else if (period === 'week')  { start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); }
  else if (period === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0); }
  else if (period === 'year')  { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
  return date >= start;
}

// Parsea items/customer_info si vienen como string JSON
const parseField = (field) => {
  if (!field) return field;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return field; }
  }
  return field;
};

export default function OrdersUpdate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);   // id del pedido que se está actualizando
  const [expanded,     setExpanded]     = useState(null);
  const [period,       setPeriod]       = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') {
      navigate('/');
      toast.error('Acceso solo para administradores');
    }
  }, [user, navigate]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    API.get('/api/orders')
      .then(res => {
        let data = res?.data ?? res ?? [];
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          data = data.orders ?? data.data ?? data.pedidos ?? [];
        }
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Error al cargar pedidos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── FIX PRINCIPAL: comparar con getId() en lugar de o.id directamente ──
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await API.put(`/api/orders/${orderId}/status`, { status: newStatus });

      setOrders(prev =>
        prev.map(o =>
          getId(o) === orderId           // ← antes: o.id === orderId (fallaba con _id)
            ? { ...o, status: newStatus }
            : o
        )
      );

      toast.success('Estado actualizado');
    } catch (err) {
      console.error('[OrdersUpdate] Error al actualizar:', err);
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter(o => {
    const dateField = o.created_at ?? o.createdAt ?? o.date;
    const inPeriod  = isInPeriod(dateField, period);
    const inStatus  = statusFilter === 'all' || o.status === statusFilter;
    const info      = parseField(o.customer_info) || {};
    const term      = search.toLowerCase();
    const inSearch  = !term ||
      (o.user_name  || '').toLowerCase().includes(term) ||
      (info.name    || '').toLowerCase().includes(term) ||
      (info.email   || '').toLowerCase().includes(term) ||
      String(getId(o) ?? '').toLowerCase().includes(term);
    return inPeriod && inStatus && inSearch;
  });

  const totalRevenue   = filtered.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total ?? 0), 0);
  const pendingCount   = filtered.filter(o => o.status === 'pending').length;
  const deliveredCount = filtered.filter(o => o.status === 'delivered').length;

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="orders-page container">

      {/* Encabezado */}
      <div className="orders-header">
        <div>
          <h1>Gestión de <span className="text-accent">Pedidos</span></h1>
          <p className="orders-subtitle">
            {filtered.length} pedido{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadOrders}>🔄 Actualizar</button>
      </div>

      {/* Stats */}
      <div className="orders-stats">
        <div className="stat-card card">
          <span className="stat-icon">💰</span>
          <div>
            <span className="stat-num">{formatPrice(totalRevenue)}</span>
            <span className="stat-label">Ingresos del período</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon">📋</span>
          <div>
            <span className="stat-num">{filtered.length}</span>
            <span className="stat-label">Pedidos</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon">🕐</span>
          <div>
            <span className="stat-num">{pendingCount}</span>
            <span className="stat-label">Pendientes</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon">📦</span>
          <div>
            <span className="stat-num">{deliveredCount}</span>
            <span className="stat-label">Entregados</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="orders-filters card">
        <div className="filter-group">
          <span className="filter-label">📅 Período</span>
          <div className="period-pills">
            {PERIOD_OPTIONS.map(p => (
              <button key={p.value}
                className={`period-pill ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">🏷️ Estado</span>
          <div className="period-pills">
            <button className={`period-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}>Todos</button>
            {STATUS_OPTIONS.map(s => (
              <button key={s.value}
                className={`period-pill ${statusFilter === s.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(s.value)}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">🔍 Buscar</span>
          <input type="text" className="form-input search-input"
            placeholder="Nombre, email o # pedido..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: 48 }}>📋</p>
          <h3>No hay pedidos</h3>
          <p>No se encontraron pedidos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map(order => {
            const orderId  = getId(order);
            const info     = parseField(order.customer_info) || {};
            const items    = Array.isArray(parseField(order.items)) ? parseField(order.items) : [];
            const status   = getStatusInfo(order.status);
            const isOpen   = expanded === orderId;
            const isUpdating = updating === orderId;
            const dateField  = order.created_at ?? order.createdAt ?? order.date;

            return (
              <div key={orderId} className={`order-card card ${order.status}`}>

                {/* Fila resumen (clickeable para expandir) */}
                <div className="order-card-header" onClick={() => setExpanded(isOpen ? null : orderId)}>
                  <div className="order-id-col">
                    <span className="order-id">#{String(orderId ?? '').slice(-6).toUpperCase()}</span>
                    <span className="order-date">{formatDate(dateField)}</span>
                  </div>
                  <div className="order-client-col">
                    <span className="order-client-name">{info.name || order.user_name || 'Cliente'}</span>
                    <span className="order-client-email">{info.email || order.user_email || ''}</span>
                  </div>
                  <div className="order-total-col">
                    <span className="order-total">{formatPrice(order.total)}</span>
                    <span className="order-items-count">
                      {items.length} producto{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="order-status-col">
                    <span className={`status-badge status-${order.status}`}>
                      {status.emoji} {status.label}
                    </span>
                  </div>
                  <div className="order-expand-col">
                    <span className="expand-icon">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Detalle expandible */}
                {isOpen && (
                  <div className="order-detail">
                    <div className="order-detail-grid">

                      {/* Productos */}
                      <div className="order-items-section">
                        <h4>🛍️ Productos</h4>
                        <div className="order-items-list">
                          {items.map((item, i) => (
                            <div key={getId(item) ?? i} className="order-item-row">
                              <img
                                src={item.image || item.imageUrl || 'https://placehold.co/48x48?text=?'}
                                alt={item.name}
                                className="order-item-img"
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/48x48?text=?'; }}
                              />
                              <div className="order-item-info">
                                <span className="order-item-name">{item.name ?? 'Producto'}</span>
                                <span className="order-item-qty">
                                  {item.quantity ?? 1}x — {formatPrice(item.price ?? 0)}
                                </span>
                              </div>
                              <span className="order-item-subtotal">
                                {formatPrice((item.price ?? 0) * (item.quantity ?? 1))}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="order-total-row">
                          <strong>Total:</strong>
                          <strong>{formatPrice(order.total)}</strong>
                        </div>
                      </div>

                      {/* Cliente + cambio de estado */}
                      <div className="order-right-section">
                        <div className="order-customer-info">
                          <h4>👤 Cliente</h4>
                          <p><strong>Nombre:</strong> {info.name || order.user_name || '—'}</p>
                          <p><strong>Email:</strong>  {info.email || order.user_email || '—'}</p>
                          {info.phone   && <p><strong>Teléfono:</strong> {info.phone}</p>}
                          {info.address && <p><strong>Dirección:</strong> {info.address}</p>}
                        </div>

                        <div className="order-status-update">
                          <h4>🔄 Actualizar estado</h4>
                          <div className="status-buttons">
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s.value}
                                className={`status-btn status-btn-${s.value} ${order.status === s.value ? 'current' : ''}`}
                                onClick={() => handleStatusChange(orderId, s.value)}
                                disabled={isUpdating || order.status === s.value}
                              >
                                {isUpdating && order.status !== s.value
                                  ? <span className="btn-spinner" />
                                  : `${s.emoji} ${s.label}`
                                }
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}