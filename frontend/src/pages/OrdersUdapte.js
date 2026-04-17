import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year',  label: 'Año' },
  { value: 'all',   label: 'Todo' },
];

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const DAY_NAMES = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

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

function formatShortDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const parseField = (field) => {
  if (!field) return field;
  if (typeof field === 'string') {
    try { return JSON.parse(field); } catch { return field; }
  }
  return field;
};

// ── Mini Calendar Component ──────────────────────────────────────────
function MiniCalendar({ rangeStart, rangeEnd, onSelect, onClose }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hovered,   setHovered]   = useState(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSameDay = (a, b) => a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate();

  const inRange = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    const end = rangeEnd || hovered;
    if (!rangeStart || !end) return false;
    const [lo, hi] = rangeStart <= end ? [rangeStart, end] : [end, rangeStart];
    return d > lo && d < hi;
  };

  const isStart = (day) => isSameDay(new Date(viewYear, viewMonth, day), rangeStart);
  const isEnd   = (day) => isSameDay(new Date(viewYear, viewMonth, day), rangeEnd);

  const handleDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    onSelect(d);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mini-calendar">
      <div className="cal-nav">
        <button className="cal-arrow" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="cal-arrow" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {DAY_NAMES.map(d => (
          <span key={d} className="cal-day-name">{d}</span>
        ))}
        {cells.map((day, i) => (
          <button
            key={i}
            className={[
              'cal-day',
              !day                     ? 'cal-day--empty'  : '',
              day && isStart(day)      ? 'cal-day--start'  : '',
              day && isEnd(day)        ? 'cal-day--end'    : '',
              day && inRange(day)      ? 'cal-day--range'  : '',
              day && isSameDay(new Date(viewYear, viewMonth, day), today) ? 'cal-day--today' : '',
            ].join(' ')}
            disabled={!day}
            onClick={() => day && handleDay(day)}
            onMouseEnter={() => day && setHovered(new Date(viewYear, viewMonth, day))}
            onMouseLeave={() => setHovered(null)}
          >
            {day || ''}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Date Range Picker ────────────────────────────────────────────────
function DateRangePicker({ period, onPeriodChange, dateRange, onDateRangeChange }) {
  const [open,   setOpen]   = useState(false);
  const [step,   setStep]   = useState(0); // 0=pick start, 1=pick end
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (date) => {
    if (step === 0) {
      onDateRangeChange({ start: date, end: null });
      setStep(1);
    } else {
      const [lo, hi] = date >= dateRange.start
        ? [dateRange.start, date]
        : [date, dateRange.start];
      onDateRangeChange({ start: lo, end: hi });
      setStep(0);
      setOpen(false);
    }
  };

  const handlePreset = (p) => {
    onPeriodChange(p);
    onDateRangeChange({ start: null, end: null });
    setOpen(false);
  };

  const hasCustomRange = dateRange.start && dateRange.end;
  const displayLabel = hasCustomRange
    ? `${formatShortDate(dateRange.start)} – ${formatShortDate(dateRange.end)}`
    : period !== 'all'
      ? PERIOD_OPTIONS.find(p => p.value === period)?.label ?? 'Período'
      : 'Todas las fechas';

  return (
    <div className="date-picker-wrap" ref={ref}>
      <button
        className={`date-picker-trigger ${open ? 'open' : ''} ${hasCustomRange ? 'has-range' : ''}`}
        onClick={() => { setOpen(o => !o); setStep(0); }}
      >
        <span className="date-picker-icon">📅</span>
        <span className="date-picker-label">{displayLabel}</span>
        <span className="date-picker-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="date-picker-dropdown">
          <div className="date-picker-presets">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.value}
                className={`preset-btn ${period === p.value && !hasCustomRange ? 'active' : ''}`}
                onClick={() => handlePreset(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="date-picker-divider" />
          <div className="date-picker-hint">
            {step === 0 ? '📌 Selecciona fecha de inicio' : '📌 Selecciona fecha de fin'}
          </div>
          <MiniCalendar
            rangeStart={dateRange.start}
            rangeEnd={dateRange.end}
            onSelect={handleSelect}
          />
          {hasCustomRange && (
            <button
              className="date-clear-btn"
              onClick={() => { onDateRangeChange({ start: null, end: null }); onPeriodChange('all'); }}
            >
              ✕ Limpiar rango
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal de eliminación ─────────────────────────────────────────────
function DeleteModal({ order, onConfirm, onCancel, isDeleting }) {
  const info    = parseField(order?.customer_info) || {};
  const orderId = getId(order);
  const label   = info.name || order?.user_name || 'Cliente';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🗑️</div>
        <h3 className="modal-title">¿Eliminar pedido?</h3>
        <p className="modal-body">
          Vas a eliminar el pedido{' '}
          <strong>#{String(orderId ?? '').slice(-6).toUpperCase()}</strong> de{' '}
          <strong>{label}</strong>. Esta acción no se puede deshacer.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <span className="btn-spinner" /> : '🗑️ Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers de filtrado ──────────────────────────────────────────────
function isInPeriod(dateStr, period, dateRange) {
  if (dateRange?.start && dateRange?.end) {
    const d   = new Date(dateStr);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);
    return d >= dateRange.start && d <= end;
  }
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

// ── Componente principal ─────────────────────────────────────────────
export default function OrdersUpdate() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded,     setExpanded]     = useState(null);
  const [period,       setPeriod]       = useState('all');
  const [dateRange,    setDateRange]    = useState({ start: null, end: null });
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

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await API.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => getId(o) === orderId ? { ...o, status: newStatus } : o));
      toast.success('Estado actualizado');
    } catch (err) {
      console.error('[OrdersUpdate] Error al actualizar:', err);
      toast.error('Error al actualizar estado');
    } finally { setUpdating(null); }
  };

  const handleDeleteConfirm = async () => {
    const orderId = getId(deleteTarget);
    setDeleting(orderId);
    try {
      await API.delete(`/api/orders/${orderId}`);
      setOrders(prev => prev.filter(o => getId(o) !== orderId));
      toast.success('Pedido eliminado');
      setDeleteTarget(null);
      if (expanded === orderId) setExpanded(null);
    } catch (err) {
      console.error('[OrdersUpdate] Error al eliminar:', err);
      toast.error('Error al eliminar el pedido');
    } finally { setDeleting(null); }
  };

  const filtered = orders.filter(o => {
    const dateField = o.created_at ?? o.createdAt ?? o.date;
    const inPeriod  = isInPeriod(dateField, period, dateRange);
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

      {deleteTarget && (
        <DeleteModal
          order={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={!!deleting}
        />
      )}

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

      {/* ── Filtros reorganizados ── */}
      <div className="orders-filters card">

        {/* Fila 1: Estado */}
        <div className="filter-row filter-row--status">
          <span className="filter-label">🏷️ Estado</span>
          <div className="status-filter-pills">
            <button
              className={`status-filter-pill all ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Todos
              <span className="pill-count">{orders.length}</span>
            </button>
            {STATUS_OPTIONS.map(s => {
              const count = orders.filter(o => o.status === s.value).length;
              return (
                <button
                  key={s.value}
                  className={`status-filter-pill ${s.value} ${statusFilter === s.value ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s.value)}
                >
                  <span>{s.emoji} {s.label}</span>
                  {count > 0 && <span className="pill-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fila 2: Buscador + Calendario */}
        <div className="filter-row filter-row--search">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input-long"
              placeholder="Buscar por nombre, email o número de pedido..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <DateRangePicker
            period={period}
            onPeriodChange={setPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
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
            const orderId    = getId(order);
            const info       = parseField(order.customer_info) || {};
            const items      = Array.isArray(parseField(order.items)) ? parseField(order.items) : [];
            const status     = getStatusInfo(order.status);
            const isOpen     = expanded === orderId;
            const isUpdating = updating === orderId;
            const isDeleting = deleting === orderId;
            const dateField  = order.created_at ?? order.createdAt ?? order.date;

            return (
              <div key={orderId} className={`order-card card ${order.status}`}>

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

                  <div className="order-actions-col" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-delete-order"
                      title="Eliminar pedido"
                      disabled={isDeleting || isUpdating}
                      onClick={() => setDeleteTarget(order)}
                    >
                      {isDeleting ? <span className="btn-spinner" /> : '🗑️'}
                    </button>
                  </div>

                  <div className="order-expand-col">
                    <span className="expand-icon">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="order-detail">
                    <div className="order-detail-grid">
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
                                  : `${s.emoji} ${s.label}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="order-delete-section">
                          <h4>⚠️ Zona de peligro</h4>
                          <button
                            className="btn btn-danger btn-delete-full"
                            onClick={() => setDeleteTarget(order)}
                            disabled={isDeleting || isUpdating}
                          >
                            {isDeleting ? <span className="btn-spinner" /> : '🗑️ Eliminar pedido'}
                          </button>
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