import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('¡Cuenta creada exitosamente! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="auth-icon">✨</span>
          <h1>Crear Cuenta</h1>
          <p>Únete y empieza a comprar hoy</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nombre completo</label>
            <input type="text" name="name" className="form-input" placeholder="Tu nombre" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" className="form-input" placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" name="password" className="form-input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input type="password" name="confirm" className="form-input" placeholder="Repite tu contraseña" value={form.confirm} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta 🚀'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="link-accent">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
