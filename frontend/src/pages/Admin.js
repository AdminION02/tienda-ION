import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../api';
import API from '../api';
import toast from 'react-hot-toast';
import './Admin.css';

// ─── Constantes ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name:        '',
  description: '',
  price:       '',
  category:    '',
  image:       '',
  stock:       '',
  featured:    false,
};

const CATEGORIES = [
  'Promociones', 'Audio', 'Cargadores', 'Baterías',
  'Cables', 'Bocinas', 'Smartwatch', 'Dispositivo Móvil', 'Línea Blanca',
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  // Productos
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Imagen
  const [imageMode, setImageMode]       = useState('url');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // ─── Auth guard ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') {
      navigate('/');
      toast.error('Acceso solo para administradores');
    }
  }, [user, navigate]);

  // ─── Carga de productos ────────────────────────────────────────────────────

  const loadProducts = () => {
    setLoading(true);
    getProducts()
      .then(res => setProducts(res.data))
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  // ─── Handlers de imagen ────────────────────────────────────────────────────

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetImageState = () => {
    setImageMode('url');
    setImageFile(null);
    setImagePreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ─── Handlers del formulario ───────────────────────────────────────────────

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    resetImageState();
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = product => {
    setEditing(product.id);
    setForm({
      name:        product.name        || '',
      description: product.description || '',
      price:       product.price       || '',
      category:    product.category    || '',
      image:       product.image       || '',
      stock:       product.stock       || '',
      featured:    product.featured    || false,
    });
    resetImageState();
    if (product.image) setImagePreview(product.image);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    resetImageState();
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.name || !form.price || !form.category) {
      toast.error('Nombre, precio y categoría son obligatorios');
      return;
    }

    const tieneUrl  = imageMode === 'url'  && form.image.trim();
    const tieneFile = imageMode === 'file' && imageFile;
    if (!tieneUrl && !tieneFile) {
      toast.error('Agrega una imagen (archivo o URL)');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.image;

      // 1. Si viene archivo → subir a Cloudinary primero y obtener URL
      if (imageMode === 'file' && imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);

        const uploadRes = await API.post('/api/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.url; // URL pública de Cloudinary
      }

      // 2. Guardar producto con la URL final (sea de Cloudinary o pegada a mano)
      const payload = {
        name:        form.name,
        description: form.description,
        price:       Number(form.price),
        category:    form.category,
        image:       imageUrl,
        stock:       Number(form.stock) || 0,
        featured:    form.featured,
      };

      if (editing) await API.put(`/api/products/${editing}`, payload);
      else         await API.post('/api/products', payload);

      toast.success(editing ? '✅ Producto actualizado' : '✅ Producto creado');
      closeForm();
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ─── Eliminar ──────────────────────────────────────────────────────────────

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await API.delete(`/api/products/${id}`);
      toast.success('🗑️ Producto eliminado');
      loadProducts();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatPrice = p =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(p);

  const filtered = products.filter(p =>
    (p.name     || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const previewSrc = imageMode === 'file' ? imagePreview : form.image || imagePreview;

  if (!user || user.role !== 'admin') return null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="admin-page container">

      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Panel <span className="text-accent">Admin</span></h1>
          <p className="admin-subtitle">Bienvenido, {user.name} 👑</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/OrdersUdapte')}>
            📋 Ver pedidos
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card card">
          <span className="stat-icon">📦</span>
          <div>
            <span className="stat-num">{products.length}</span>
            <span className="stat-label">Productos</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon">⭐</span>
          <div>
            <span className="stat-num">{products.filter(p => p.featured).length}</span>
            <span className="stat-label">Destacados</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon">📉</span>
          <div>
            <span className="stat-num">{products.filter(p => p.stock === 0).length}</span>
            <span className="stat-label">Sin stock</span>
          </div>
        </div>
        <div className="stat-card card">
          <span className="stat-icon">🏷️</span>
          <div>
            <span className="stat-num">{[...new Set(products.map(p => p.category))].length}</span>
            <span className="stat-label">Categorías</span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="admin-form-wrap card">
          <div className="form-header">
            <h3>{editing ? '✏️ Editar producto' : '➕ Nuevo producto'}</h3>
            <button className="close-btn" onClick={closeForm}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-grid">

              {/* Nombre */}
              <div className="form-group">
                <label>Nombre del producto *</label>
                <input
                  name="name"
                  className="form-input"
                  placeholder="Ej: Audífonos Bluetooth"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Categoría */}
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  name="category"
                  className="form-input form-select"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Precio */}
              <div className="form-group">
                <label>Precio (COP) *</label>
                <input
                  name="price"
                  type="number"
                  className="form-input"
                  placeholder="Ej: 180000"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              {/* Stock */}
              <div className="form-group">
                <label>Stock disponible</label>
                <input
                  name="stock"
                  type="number"
                  className="form-input"
                  placeholder="Ej: 50"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              {/* Imagen */}
              <div className="form-group full-width">
                <label>Imagen del producto</label>

                <div className="image-mode-tabs">
                  <button
                    type="button"
                    className={`image-tab ${imageMode === 'url' ? 'active' : ''}`}
                    onClick={() => { setImageMode('url'); setImageFile(null); setImagePreview(''); }}
                  >
                    🔗 URL
                  </button>
                  <button
                    type="button"
                    className={`image-tab ${imageMode === 'file' ? 'active' : ''}`}
                    onClick={() => { setImageMode('file'); setForm(f => ({ ...f, image: '' })); }}
                  >
                    📁 Subir archivo
                  </button>
                </div>

                {imageMode === 'url' && (
                  <>
                    <input
                      name="image"
                      type="url"
                      className="form-input"
                      placeholder="https://..."
                      value={form.image}
                      onChange={handleChange}
                    />
                    <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                      💡 Sube tu imagen a{' '}
                      <a href="https://imgbb.com" target="_blank" rel="noreferrer">imgbb.com</a> o{' '}
                      <a href="https://imgur.com" target="_blank" rel="noreferrer">imgur.com</a> y pega el enlace aquí
                    </small>
                  </>
                )}

                {imageMode === 'file' && (
                  <>
                    <div
                      className="file-drop-zone"
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileChange({ target: { files: [file] } });
                      }}
                    >
                      {imageFile
                        ? <span>📎 {imageFile.name}</span>
                        : <span>Arrastra una imagen aquí o <strong>haz clic para seleccionar</strong></span>
                      }
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                      Formatos: JPG, PNG, WEBP · Máximo 5 MB
                    </small>
                  </>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group full-width">
                <label>Descripción</label>
                <textarea
                  name="description"
                  className="form-input form-textarea"
                  placeholder="Describe el producto..."
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Destacado */}
              <div className="form-group featured-check full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={handleChange}
                  />
                  <span className="checkmark" />
                  ⭐ Marcar como producto destacado (aparece en el inicio)
                </label>
              </div>
            </div>

            {/* Vista previa */}
            {previewSrc && (
              <div className="img-preview">
                <span>Vista previa:</span>
                <img
                  src={previewSrc}
                  alt="preview"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Acciones */}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeForm}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editing ? '💾 Guardar cambios' : '✅ Crear producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="search-wrap" style={{ maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="results-count">
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: 48 }}>📦</p>
          <h3>No hay productos</h3>
          <p>Crea tu primer producto</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Destacado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className={product.stock === 0 ? 'out-of-stock' : ''}>
                  <td>
                    <img
                      src={product.image || 'https://placehold.co/60x60?text=Sin+foto'}
                      alt={product.name}
                      className="table-img"
                    />
                  </td>
                  <td>
                    <span className="product-name-cell">{product.name}</span>
                    <span className="product-desc-cell">
                      {product.description?.slice(0, 50)}
                      {product.description?.length > 50 ? '...' : ''}
                    </span>
                  </td>
                  <td><span className="cat-tag">{product.category}</span></td>
                  <td><span className="price">{formatPrice(product.price)}</span></td>
                  <td>
                    <span className={`stock-badge ${
                      product.stock === 0 ? 'stock-out'
                      : product.stock < 10 ? 'stock-low'
                      : 'stock-ok'
                    }`}>
                      {product.stock === 0
                        ? '❌ Agotado'
                        : product.stock < 10
                        ? `⚠️ ${product.stock}`
                        : `✅ ${product.stock}`}
                    </span>
                  </td>
                  <td className="centered">{product.featured ? '⭐' : '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit" onClick={() => openEdit(product)}>
                        ✏️ Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleting === product.id}
                      >
                        {deleting === product.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}