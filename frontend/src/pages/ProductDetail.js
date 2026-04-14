import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct } from '../api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    getProduct(id)
      .then(res => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`✅ ${qty}x ${product.name} agregado al carrito`);
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!product) return <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>Producto no encontrado. <Link to="/products">Volver</Link></div>;

  return (
    <div className="detail-page container">
      <Link to="/products" className="back-btn">Volver a productos</Link>
      <div className="detail-grid">
        <div className="detail-img-wrap">
          <img src={product.image} alt={product.name} className="detail-img" />
          {product.featured && <span className="featured-tag">⭐ Destacado</span>}
        </div>
        <div className="detail-info">
          <span className="product-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-price price">{formatPrice(product.price)}</p>
          <p className="detail-desc">{product.description}</p>

          <div className="detail-stock">
            <span className={`stock-dot ${product.stock > 0 ? 'in' : 'out'}`} />
            {product.stock > 0 ? `✅ En stock (${product.stock} disponibles)` : '❌ Agotado'}
          </div>

          <div className="qty-row">
            <label>Cantidad:</label>
            <div className="qty-ctrl">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={handleAdd} disabled={product.stock === 0} style={{ flex: 1 }}>
              🛒 Agregar al carrito
            </button>
            <Link to="/cart" className="btn btn-whatsapp" style={{ flex: 1, justifyContent: 'center' }}>
              Ver carrito 💬
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
