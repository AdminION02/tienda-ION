import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cierra el menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Bloquea scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const close = () => setMenuOpen(false);

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="navbar-inner">

        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo" onClick={close}>
          <img src="/logo.png" alt="ION." className="navbar-logo-img" />
        </Link>

        {/* ── Links de navegación (desktop) ── */}
        <div className="navbar-links">
          <Link to="/"         className="nav-link">Inicio</Link>
          <Link to="/products" className="nav-link">Productos</Link>
          {user && (
            <Link to="/orders" className="nav-link">Mis Pedidos</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-link nav-link-admin">
              👑 Admin
            </Link>
          )}
        </div>

        {/* ── Acciones (desktop) ── */}
        <div className="navbar-actions">
          <Link to="/cart" className="cart-btn" aria-label="Carrito">
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
              <Link to="/login"    className="btn btn-secondary nav-btn">Entrar</Link>
              <Link to="/register" className="btn btn-primary   nav-btn">Registrarse</Link>
            </div>
          )}
        </div>

        {/* ── Botón hamburguesa ── */}
        <button
          className={`hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      </div>

      {/* ══════════════════════════════════════════
          DRAWER MÓVIL — contiene TODO el menú
      ══════════════════════════════════════════ */}
      <div className={`mobile-drawer ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-inner">

          {/* Navegación */}
          <nav className="mobile-nav">
            <Link to="/"         className="mobile-nav-link" onClick={close}>Inicio</Link>
            <Link to="/products" className="mobile-nav-link" onClick={close}>Productos</Link>
            {user && (
              <Link to="/orders" className="mobile-nav-link" onClick={close}>Mis Pedidos</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="mobile-nav-link mobile-nav-link-admin" onClick={close}>
                👑 Admin
              </Link>
            )}
          </nav>

          <div className="mobile-divider" />

          {/* Carrito + acciones de sesión */}
          <div className="mobile-actions">
            <Link to="/cart" className="mobile-cart-link" onClick={close}>
              🛒 Carrito
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>

            {user ? (
              <>
                <span className="mobile-user-name">👤 {user.name.split(' ')[0]}</span>
                <button className="btn btn-secondary mobile-full-btn" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-secondary mobile-full-btn" onClick={close}>
                  Entrar
                </Link>
                <Link to="/register" className="btn btn-primary   mobile-full-btn" onClick={close}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlay detrás del drawer */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={close} aria-hidden="true" />
      )}
    </nav>
  );
}