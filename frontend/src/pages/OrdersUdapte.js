import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import './Orders.css';

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pendiente',   emoji: '🕐' },
  { value: 'confirmed',  label: 'Confirmado',  emoji: '✅' },
  { value: 'shipped',    label: 'Enviado',     emoji: '🚚' },
  { value: 'delivered',  label: 'Entregado',   emoji: '📦' },
  { value: 'cancelled',  label: 'Cancelado',   emoji: '❌' },
];

const PERIOD_OPTIONS = [
  { value: 'day',   label: 'Hoy' },
  { value: 'week',  label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year',  label: 'Este año' },
  { value: 'all',   label: 'Todos' },
];

function getStatusInfo(status) {
  return STATUS_OPTIONS.find(s => s.value === status) || { label: status, emoji: '❓' };
}

function formatPrice(p) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(p);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isInPeriod(dateStr, period) {
  if (period === 'all') return true;
  const date  = new Date(dateStr);
  const now   = new Date();
  const start = new Date(now);

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = now.getDay(); // 0=Sun
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'year') {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return date >= start;
}

export default function Orders() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [period,   setPeriod]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,   setSearch]   = useState('');

  // Proteger ruta
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') {
      navigate('/');
      toast.error('Acceso solo para administradores');
    }
  }, [user, navigate]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    API.get('/orders')
      .then(res => setOrders(res.data))
      .catch(() => toast.error('Error al cargar pedidos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      toast.success('✅ Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  // Filtrar
  const filtered = orders.filter(o => {
    const inPeriod = isInPeriod(o.created_at, period);
    const inStatus = statusFilter === 'all' || o.status === statusFilter;
    const term     = search.toLowerCase();
    const info     = typeof o.customer_info === 'string'
      ? JSON.parse(o.customer_info) : (o.customer_info || {});
    const inSearch = !term ||
      (o.user_name  || '').toLowerCase().includes(term) ||
      (info.name    || '').toLowerCase().includes(term) ||
      (info.email   || '').toLowerCase().includes(term) ||
      String(o.id).includes(term);
    return inPeriod && inStatus && inSearch;
  });

  // Stats del período
  const totalRevenue   = filtered.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
  const pendingCount   = filtered.filter(o => o.status === 'pending').length;
  const deliveredCount = filtered.filter(o => o.status === 'delivered').length;

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="orders-page container">

      {/* Header */}
      <div className="orders-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/admin')}>
            ← Volver al panel
          </button>
          <h1>Gestión de <span className="text-accent">Pedidos</span></h1>
          <p className="orders-subtitle">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-secondary" onClick={loadOrders}>
          🔄 Actualizar
        </button>
      </div>

      {/* Stats rápidas */}
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

        {/* Período */}
        <div className="filter-group">
          <span className="filter-label">📅 Período</span>
          <div className="period-pills">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.value}
                className={`period-pill ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estado */}
        <div className="filter-group">
          <span className="filter-label">🏷️ Estado</span>
          <div className="period-pills">
            <button
              className={`period-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </button>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                className={`period-pill ${statusFilter === s.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(s.value)}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="filter-group">
          <span className="filter-label">🔍 Buscar</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Nombre, email o # pedido..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
        </div>

      </div>

      {/* Lista de pedidos */}
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
            const info  = typeof order.customer_info === 'string'
              ? JSON.parse(order.customer_info) : (order.customer_info || {});
            const items = typeof order.items === 'string'
              ? JSON.parse(order.items) : (order.items || []);
            const status = getStatusInfo(order.status);
            const isOpen = expanded === order.id;

            return (
              <div key={order.id} className={`order-card card ${order.status}`}>

                {/* Cabecera del pedido */}
                <div
                  className="order-card-header"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div className="order-id-col">
                    <span className="order-id">
                      #{String(order.id).slice(-6).toUpperCase()}
                    </span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>

                  <div className="order-client-col">
                    <span className="order-client-name">
                      {info.name || order.user_name || 'Cliente'}
                    </span>
                    <span className="order-client-email">
                      {info.email || order.user_email || ''}
                    </span>
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

                      {/* Items */}
                      <div className="order-items-section">
                        <h4>🛍️ Productos</h4>
                        <div className="order-items-list">
                          {items.map((item, i) => (
                            <div key={i} className="order-item-row">
                              <img
                                src={item.image || 'https://placehold.co/48x48?text=?'}
                                alt={item.name}
                                className="order-item-img"
                              />
                              <div className="order-item-info">
                                <span className="order-item-name">{item.name}</span>
                                <span className="order-item-qty">
                                  {item.quantity}x — {formatPrice(item.price)}
                                </span>
                              </div>
                              <span className="order-item-subtotal">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="order-total-row">
                          <strong>Total:</strong>
                          <strong>{formatPrice(order.total)}</strong>
                        </div>
                      </div>

                      {/* Info cliente + cambiar estado */}
                      <div className="order-right-section">
                        <div className="order-customer-info">
                          <h4>👤 Cliente</h4>
                          <p><strong>Nombre:</strong> {info.name || order.user_name || '—'}</p>
                          <p><strong>Email:</strong>  {info.email || order.user_email || '—'}</p>
                          {info.phone && <p><strong>Teléfono:</strong> {info.phone}</p>}
                          {info.address && <p><strong>Dirección:</strong> {info.address}</p>}
                        </div>

                        <div className="order-status-update">
                          <h4>🔄 Actualizar estado</h4>
                          <div className="status-buttons">
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s.value}
                                className={`status-btn status-btn-${s.value} ${order.status === s.value ? 'current' : ''}`}
                                onClick={() => handleStatusChange(order.id, s.value)}
                                disabled={updating === order.id || order.status === s.value}
                              >
                                {updating === order.id && order.status !== s.value
                                  ? '...'
                                  : `${s.emoji} ${s.label}`}
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