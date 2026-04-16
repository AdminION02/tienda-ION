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
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    getProduct(id)
      .then(res => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Reiniciar carrusel al cargar nuevo producto
  useEffect(() => { setActiveImg(0); }, [product]);

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`✅ ${qty}x ${product.name} agregado al carrito`);
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!product) return (
    <div className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
      Producto no encontrado. <Link to="/products">Volver</Link>
    </div>
  );

  // Armar array solo con imágenes que existan
  const images = [
    product.image,
    product.image2,
    product.image3,
    product.image4,
    product.image5,
  ].filter(Boolean);

  const prev = () => setActiveImg(i => (i - 1 + images.length) % images.length);
  const next = () => setActiveImg(i => (i + 1) % images.length);

  return (
    <div className="detail-page container">
      <div className="detail-grid">

        {/* ── Carrusel ── */}
        <div className="detail-gallery">
          <div className="carousel-wrap">
            <img
              src={images[activeImg]}
              alt={`${product.name} - foto ${activeImg + 1}`}
              className="carousel-main-img"
            />
            {product.featured && <span className="featured-tag">⭐ Destacado</span>}

            {images.length > 1 && (
              <>
                <button className="carousel-btn prev" onClick={prev} aria-label="Anterior">&#8249;</button>
                <button className="carousel-btn next" onClick={next} aria-label="Siguiente">&#8250;</button>

                {/* Dots */}
                <div className="carousel-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`carousel-dot ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Foto ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {images.length > 1 && (
            <div className="carousel-thumbs">
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`miniatura ${i + 1}`}
                  className={`carousel-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
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