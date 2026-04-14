import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../api';
import toast from 'react-hot-toast';
import './Cart.css';

// ── FIX: lee _id (MongoDB) o id (Supabase), lo que exista ──
const getId = (item) => item?._id ?? item?.id ?? null;

const formatPrice = (p) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone]     = useState('');
  const [address, setAddress] = useState('');

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para comprar');
      navigate('/login');
      return;
    }
    if (items.length === 0) return;

    setLoading(true);
    try {
      const orderData = {
        items: items.map(i => ({
          product:  getId(i),   // ← antes: i._id
          name:     i.name,
          price:    i.price,
          quantity: i.quantity,
          image:    i.image,
        })),
        total,
        customerInfo: {
          name: user.name,
          email: user.email,
          phone,
          address,
        },
      };

      const res = await createOrder(orderData);
      const { whatsappLink } = res.data;

      clearCart();
      toast.success('¡Pedido registrado! Redirigiendo a WhatsApp...');

      setTimeout(() => {
        window.open(whatsappLink, '_blank');
        navigate('/orders');
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty container">
        <div className="empty-icon">🛒</div>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos para comenzar tu compra</p>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
          Ver Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <div className="page-header" style={{ textAlign: 'left', paddingBottom: 32 }}>
        <h1>Tu <span className="text-accent">Carrito</span></h1>
        <p>{count} producto{count !== 1 ? 's' : ''} seleccionado{count !== 1 ? 's' : ''}</p>
      </div>

      <div className="cart-layout">

        {/* ── Lista de ítems ── */}
        <div className="cart-items">
          {items.map(item => {
            const itemId = getId(item);   // ← antes: item._id
            return (
              <div key={itemId} className="cart-item card">
                <img src={item.image} alt={item.name} className="cart-img" />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <span className="item-category">{item.category}</span>
                  <p className="item-price price">{formatPrice(item.price)}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-ctrl">
                    <button onClick={() => updateQuantity(itemId, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(itemId, item.quantity + 1)}>+</button>
                  </div>
                  <p className="item-subtotal">{formatPrice(item.price * item.quantity)}</p>
                  <button className="remove-btn" onClick={() => removeItem(itemId)}>🗑️</button>
                </div>
              </div>
            );
          })}

          <button className="btn btn-secondary clear-btn" onClick={clearCart}>
            Vaciar carrito
          </button>
        </div>

        {/* ── Resumen del pedido ── */}
        <div className="cart-summary card">
          <h3>Resumen del pedido</h3>

          <div className="summary-items">
            {items.map(item => (
              <div key={getId(item)} className="summary-row">   {/* ← antes: item._id */}
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total</span>
            <span className="price">{formatPrice(total)}</span>
          </div>

          {user && (
            <div className="extra-info">
              <div className="form-group">
                <label>Teléfono (opcional)</label>
                <input type="tel" className="form-input"
                  placeholder="Tu número de contacto"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Dirección de entrega (opcional)</label>
                <input type="text" className="form-input"
                  placeholder="Tu dirección"
                  value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>
          )}

          <button className="btn btn-whatsapp checkout-btn"
            onClick={handleCheckout} disabled={loading}>
            {loading ? 'Procesando...' : '💬 Pedir por WhatsApp'}
          </button>

          {!user && (
            <p className="login-hint">
              <Link to="/login" className="link-accent">Inicia sesión</Link> para realizar tu pedido
            </p>
          )}

          <div className="secure-badge">
            🔒 Compra 100% segura • Confirmación inmediata
          </div>
        </div>

      </div>
    </div>
  );
}