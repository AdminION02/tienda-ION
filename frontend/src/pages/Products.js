import React, { useEffect, useState } from 'react';
import { getProducts } from '../api';
import ProductCard from '../components/ProductCard';
import './Products.css';

const CATEGORIES = ['all', 'Ropa', 'Tecnología', 'Accesorios', 'Calzado', 'Libros', 'Hogar'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category !== 'all') params.category = category;
    getProducts(params)
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className="products-page container">
      <div className="page-header">
        <h1>Nuestros <span className="text-accent">Productos</span></h1>
        <p>Encuentra todo lo que necesitas al mejor precio</p>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input form-input"
          />
        </div>
        <div className="categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-btn ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? '🌟 Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: 48 }}>🔍</p>
          <h3>No se encontraron productos</h3>
          <p>Intenta con otros filtros o términos de búsqueda</p>
        </div>
      ) : (
        <>
          <p className="results-count">{products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}</p>
          <div className="products-grid">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
