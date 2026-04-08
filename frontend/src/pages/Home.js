import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ featured: true })
      .then(res => setFeatured(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-badge badge badge-accent">🔥 Nueva colección</div>
          <h1 className="hero-title">
            Compra lo mejor,<br />
            <span className="hero-accent">sin complicaciones</span>
          </h1>
          <p className="hero-subtitle">
            Los mejores productos al mejor precio. Pide directamente por WhatsApp.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary hero-btn">
              Ver Productos 🛍️
            </Link>
            <a
              href={`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER || '573001234567'}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp hero-btn"
            >
              💬 WhatsApp
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">500+</span>
              <span className="stat-label">Productos</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">2k+</span>
              <span className="stat-label">Clientes</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">24h</span>
              <span className="stat-label">Entrega</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        {[
          { icon: '🚀', title: 'Envío rápido', desc: 'Recibe tu pedido en 24-48 horas' },
          { icon: '🔒', title: 'Pago seguro', desc: 'Tus datos siempre protegidos' },
          { icon: '💬', title: 'WhatsApp directo', desc: 'Confirmación instantánea' },
          { icon: '↩️', title: 'Fácil devolución', desc: 'Garantía de satisfacción' },
        ].map((f, i) => (
          <div key={i} className="feature-card card">
            <span className="feature-icon">{f.icon}</span>
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Productos destacados */}
      <section className="featured-section container">
        <div className="section-header">
          <h2>Productos <span className="text-accent">Destacados</span></h2>
          <Link to="/products" className="btn btn-secondary">Ver todos →</Link>
        </div>

        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : featured.length === 0 ? (
          <p className="text-center">No hay productos destacados por el momento.</p>
        ) : (
          <div className="products-grid">
            {featured.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA WhatsApp */}
      <section className="cta-section">
        <div className="container cta-content">
          <div className="cta-icon">💬</div>
          <h2>¿Tienes alguna pregunta?</h2>
          <p>Escríbenos directamente por WhatsApp y te respondemos al instante</p>
          <a
            href={`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER || '573001234567'}?text=Hola! Quiero información sobre sus productos.`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-whatsapp"
          >
            💬 Chatear ahora
          </a>
        </div>
      </section>
    </div>
  );
}