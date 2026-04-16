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
  image2:      '',
  image3:      '',
  image4:      '',
  image5:      '',
  stock:       '',
  featured:    false,
};

const CATEGORIES = [
  'Promociones', 'Audio', 'Cargadores', 'Baterías',
  'Cables', 'Bocinas', 'Smartwatch', 'Dispositivo Móvil', 'Línea Blanca',
];

// ─── Sub-componente: campo de imagen individual ───────────────────────────────

function ImageField({ label, fieldName, isMain = false, form, setForm, fileRef, onFileChange }) {
  const [mode, setMode] = useState('url');

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'url') {
      // limpiar vista previa del archivo
      onFileChange(fieldName, null);
    } else {
      setForm(f => ({ ...f, [fieldName]: '' }));
    }
  };

  const handleUrlChange = (e) => {
    setForm(f => ({ ...f, [fieldName]: e.target.value }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('La imagen no puede superar los 5 MB'); return; }
    onFileChange(fieldName, file);
  };

  const preview = mode === 'url' ? form[fieldName] : form[`__preview_${fieldName}`];

  return (
    <div className="form-group full-width image-field-block">
      <label>
        {isMain ? '🖼️ Imagen principal *' : `📷 ${label}`}
      </label>

      <div className="image-mode-tabs">
        <button type="button"
          className={`image-tab ${mode === 'url' ? 'active' : ''}`}
          onClick={() => handleModeChange('url')}>
          🔗 URL
        </button>
        <button type="button"
          className={`image-tab ${mode === 'file' ? 'active' : ''}`}
          onClick={() => handleModeChange('file')}>
          📁 Subir archivo
        </button>
      </div>

      {mode === 'url' && (
        <>
          <input
            name={fieldName}
            type="url"
            className="form-input"
            placeholder="https://..."
            value={form[fieldName] || ''}
            onChange={handleUrlChange}
          />
          {isMain && (
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
              💡 Sube tu imagen a{' '}
              <a href="https://imgbb.com" target="_blank" rel="noreferrer">imgbb.com</a> o{' '}
              <a href="https://imgur.com" target="_blank" rel="noreferrer">imgur.com</a> y pega el enlace aquí
            </small>
          )}
        </>
      )}

      {mode === 'file' && (
        <>
          <div
            className="file-drop-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              handleFileSelect(e.dataTransfer.files[0]);
            }}>
            {form[`__file_${fieldName}`]
              ? <span>📎 {form[`__file_${fieldName}`].name}</span>
              : <span>Arrastra una imagen aquí o <strong>haz clic para seleccionar</strong></span>
            }
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e.target.files[0])}
          />
          <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
            Formatos: JPG, PNG, WEBP · Máximo 5 MB
          </small>
        </>
      )}

      {preview && (
        <div className="img-preview-inline">
          <img src={preview} alt={`preview ${label}`} onError={e => { e.target.style.display = 'none'; }} />
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // refs para los 5 inputs de archivo
  const fileRefs = {
    image:  useRef(null),
    image2: useRef(null),
    image3: useRef(null),
    image4: useRef(null),
    image5: useRef(null),
  };

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

  // ─── Auth guard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'admin') {
      navigate('/');
      toast.error('Acceso solo para administradores');
    }
  }, [user, navigate]);

  // ─── Carga de productos ───────────────────────────────────────────────────────

  const loadProducts = () => {
    setLoading(true);
    getProducts()
      .then(res => setProducts(res.data))
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  // ─── Handler de archivo por campo ─────────────────────────────────────────────

  const handleFileChange = (fieldName, file) => {
    if (!file) {
      setForm(f => ({ ...f, [`__file_${fieldName}`]: null, [`__preview_${fieldName}`]: '' }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setForm(f => ({
      ...f,
      [`__file_${fieldName}`]:    file,
      [`__preview_${fieldName}`]: previewUrl,
    }));
  };

  // ─── Subir un archivo al servidor ─────────────────────────────────────────────

  const uploadFile = async (file) => {
    const uploadData = new FormData();
    uploadData.append('image', file);
    const res = await API.post('/api/upload', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  // ─── Helpers de formulario ─────────────────────────────────────────────────────

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    Object.values(fileRefs).forEach(r => { if (r.current) r.current.value = ''; });
  };

  const openCreate = () => {
    resetForm();
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
      image2:      product.image2      || '',
      image3:      product.image3      || '',
      image4:      product.image4      || '',
      image5:      product.image5      || '',
      stock:       product.stock       || '',
      featured:    product.featured    || false,
    });
    Object.values(fileRefs).forEach(r => { if (r.current) r.current.value = ''; });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  // ─── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.name || !form.price || !form.category) {
      toast.error('Nombre, precio y categoría son obligatorios');
      return;
    }

    // La imagen principal es obligatoria
    const mainHasUrl  = form.image?.trim();
    const mainHasFile = form.__file_image;
    if (!mainHasUrl && !mainHasFile) {
      toast.error('La imagen principal es obligatoria');
      return;
    }

    setSaving(true);
    try {
      // Resolver URLs para los 5 campos de imagen
      const imageFields = ['image', 'image2', 'image3', 'image4', 'image5'];
      const resolvedUrls = {};

      for (const field of imageFields) {
        const file = form[`__file_${field}`];
        if (file) {
          resolvedUrls[field] = await uploadFile(file);
        } else {
          resolvedUrls[field] = form[field] || '';
        }
      }

      const payload = {
        name:        form.name,
        description: form.description,
        price:       Number(form.price),
        category:    form.category,
        image:       resolvedUrls.image,
        image2:      resolvedUrls.image2,
        image3:      resolvedUrls.image3,
        image4:      resolvedUrls.image4,
        image5:      resolvedUrls.image5,
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

  // ─── Eliminar ──────────────────────────────────────────────────────────────────

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

  // ─── Helpers UI ───────────────────────────────────────────────────────────────

  const formatPrice = p =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(p);

  const filtered = products.filter(p =>
    (p.name     || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!user || user.role !== 'admin') return null;

  // ─── Render ───────────────────────────────────────────────────────────────────

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

              {/* Datos básicos */}
              <div className="form-group">
                <label>Nombre del producto *</label>
                <input name="name" className="form-input" placeholder="Ej: Audífonos Bluetooth"
                  value={form.name} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Categoría *</label>
                <select name="category" className="form-input form-select"
                  value={form.category} onChange={handleChange} required>
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Precio (COP) *</label>
                <input name="price" type="number" className="form-input" placeholder="Ej: 180000"
                  value={form.price} onChange={handleChange} min="0" required />
              </div>

              <div className="form-group">
                <label>Stock disponible</label>
                <input name="stock" type="number" className="form-input" placeholder="Ej: 50"
                  value={form.stock} onChange={handleChange} min="0" />
              </div>

              {/* ── Bloque de imágenes ── */}
              <div className="full-width">
                <div className="images-section-title">
                  <span>🖼️ Imágenes del producto</span>
                  <small>La imagen principal es obligatoria · Las adicionales son opcionales</small>
                </div>

                <div className="images-grid">
                  {[
                    { field: 'image',  label: 'Imagen principal', isMain: true  },
                    { field: 'image2', label: 'Imagen 2',         isMain: false },
                    { field: 'image3', label: 'Imagen 3',         isMain: false },
                    { field: 'image4', label: 'Imagen 4',         isMain: false },
                    { field: 'image5', label: 'Imagen 5',         isMain: false },
                  ].map(({ field, label, isMain }) => (
                    <ImageField
                      key={field}
                      label={label}
                      fieldName={field}
                      isMain={isMain}
                      form={form}
                      setForm={setForm}
                      fileRef={fileRefs[field]}
                      onFileChange={handleFileChange}
                    />
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div className="form-group full-width">
                <label>Descripción</label>
                <textarea name="description" className="form-input form-textarea"
                  placeholder="Describe el producto..." value={form.description}
                  onChange={handleChange} rows={3} />
              </div>

              {/* Destacado */}
              <div className="form-group featured-check full-width">
                <label className="checkbox-label">
                  <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                  <span className="checkmark" />
                  ⭐ Marcar como producto destacado (aparece en el inicio)
                </label>
              </div>

            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
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
          <input type="text" className="form-input search-input" placeholder="Buscar producto..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="results-count">
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: 48 }}>📦</p>
          <h3>No hay productos</h3>
          <p>Crea tu primer producto</p>
        </div>
      ) : (
        <>
          {/* ── Tabla desktop ── */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Imágenes</th>
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
                      {/* Miniatura principal + contador de fotos extras */}
                      <div className="table-img-wrap">
                        <img
                          src={product.image || 'https://placehold.co/60x60?text=Sin+foto'}
                          alt={product.name}
                          className="table-img"
                        />
                        {[product.image2, product.image3, product.image4, product.image5].filter(Boolean).length > 0 && (
                          <span className="extra-imgs-badge">
                            +{[product.image2, product.image3, product.image4, product.image5].filter(Boolean).length}
                          </span>
                        )}
                      </div>
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
                        {product.stock === 0 ? '❌ Agotado'
                          : product.stock < 10 ? `⚠️ ${product.stock}`
                          : `✅ ${product.stock}`}
                      </span>
                    </td>
                    <td className="centered">{product.featured ? '⭐' : '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => openEdit(product)}>✏️ Editar</button>
                        <button className="btn-delete"
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={deleting === product.id}>
                          {deleting === product.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Tarjetas móvil ── */}
          <div className="mobile-cards">
            {filtered.map(product => (
              <div key={product.id} className={`mobile-card card ${product.stock === 0 ? 'out-of-stock' : ''}`}>

                <div className="mobile-card-top">
                  {/* Miniaturas de todas las imágenes disponibles */}
                  <div className="mobile-imgs-row">
                    {[product.image, product.image2, product.image3, product.image4, product.image5]
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((src, i) => (
                        <img key={i} src={src} alt={`foto ${i + 1}`}
                          className={i === 0 ? 'mobile-card-img' : 'mobile-card-img-small'} />
                      ))
                    }
                    {[product.image2, product.image3, product.image4, product.image5].filter(Boolean).length > 2 && (
                      <span className="mobile-more-imgs">
                        +{[product.image2, product.image3, product.image4, product.image5].filter(Boolean).length - 2} más
                      </span>
                    )}
                  </div>
                  <div className="mobile-card-info">
                    <div className="mobile-card-name">{product.name}</div>
                    <div className="mobile-card-cat">{product.category}</div>
                    {product.featured && <div className="mobile-card-featured">⭐ Destacado</div>}
                  </div>
                </div>

                <div className="mobile-card-body">
                  <div className="mobile-card-field">
                    <span>Precio</span>
                    <span className="price">{formatPrice(product.price)}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span>Stock</span>
                    <span className={`stock-badge ${
                      product.stock === 0 ? 'stock-out'
                      : product.stock < 10 ? 'stock-low'
                      : 'stock-ok'
                    }`}>
                      {product.stock === 0 ? '❌ Agotado'
                        : product.stock < 10 ? `⚠️ ${product.stock}`
                        : `✅ ${product.stock}`}
                    </span>
                  </div>
                </div>

                {product.description && (
                  <p className="mobile-card-desc">
                    {product.description.slice(0, 80)}{product.description.length > 80 ? '...' : ''}
                  </p>
                )}

                <div className="mobile-card-actions">
                  <button className="btn-edit" style={{ flex: 1, textAlign: 'center' }}
                    onClick={() => openEdit(product)}>
                    ✏️ Editar
                  </button>
                  <button className="btn-delete"
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={deleting === product.id}>
                    {deleting === product.id ? '...' : '🗑️'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}