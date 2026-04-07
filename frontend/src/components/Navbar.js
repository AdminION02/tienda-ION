import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
  <img src="/logo.png" alt="ION." className="navbar-logo-img" />
</Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/products" className="nav-link" onClick={() => setMenuOpen(false)}>Productos</Link>
          {user && (
            <Link to="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>Mis Pedidos</Link>
          )}
           {user?.role === 'admin' && (
            <Link to="/admin" className="nav-link nav-link-admin" onClick={() => setMenuOpen(false)}>
              👑 Admin
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/cart" className="cart-btn">
            🛒
            {count > 0 && <span className="cart-badge">{count}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <span className="user-name">👤 {user.name.split(' ')[0]}</span>
              <button className="btn btn-secondary nav-btn" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary nav-btn">Entrar</Link>
              <Link to="/register" className="btn btn-primary nav-btn">Registrarse</Link>
            </div>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
