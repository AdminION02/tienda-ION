import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    toast.success(`✅ ${product.name} agregado al carrito`);
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p);

  return (
    <Link to={`/products/${product.id}`} className="product-card card">
      <div className="product-img-wrap">
        <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
        {product.featured && <span className="featured-tag">⭐ Destacado</span>}
        <div className="product-overlay">
          <button className="btn btn-primary add-btn" onClick={handleAdd}>
            🛒 Agregar
          </button>
        </div>
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="price">{formatPrice(product.price)}</span>
          <span className="stock-label">Stock: {product.stock}</span>
        </div>
      </div>
    </Link>
  );
}
