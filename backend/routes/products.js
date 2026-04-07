const express = require('express');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/products - Obtener todos los productos
router.get('/', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let filter = {};

    if (category && category !== 'all') filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
});

// POST /api/products (solo admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear producto', error: error.message });
  }
});

// PUT /api/products/:id (solo admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// DELETE /api/products/:id (solo admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

// POST /api/products/seed - Cargar productos de ejemplo
router.post('/seed/demo', async (req, res) => {
  try {
    await Product.deleteMany({});
    const demoProducts = [
      {
        name: 'Camiseta Premium',
        description: 'Camiseta de algodón 100% de alta calidad, disponible en varios colores.',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        category: 'Ropa',
        stock: 50,
        featured: true
      },
      {
        name: 'Audífonos Bluetooth',
        description: 'Audífonos inalámbricos con cancelación de ruido y 20h de batería.',
        price: 180000,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Tecnología',
        stock: 30,
        featured: true
      },
      {
        name: 'Mochila Urbana',
        description: 'Mochila resistente al agua, ideal para el trabajo o la escuela.',
        price: 95000,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        category: 'Accesorios',
        stock: 25,
        featured: true
      },
      {
        name: 'Zapatillas Deportivas',
        description: 'Zapatillas cómodas para entrenar o uso diario.',
        price: 220000,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        category: 'Calzado',
        stock: 40
      },
      {
        name: 'Reloj Elegante',
        description: 'Reloj de acero inoxidable resistente al agua.',
        price: 320000,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        category: 'Accesorios',
        stock: 15,
        featured: true
      },
      {
        name: 'Libro de Programación',
        description: 'Aprende desarrollo web moderno con proyectos prácticos.',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
        category: 'Libros',
        stock: 100
      },
      {
        name: 'Termo de Acero',
        description: 'Mantiene tus bebidas calientes 12h y frías 24h.',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        category: 'Hogar',
        stock: 60
      },
      {
        name: 'Mouse Ergonómico',
        description: 'Mouse inalámbrico diseñado para largas jornadas de trabajo.',
        price: 110000,
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
        category: 'Tecnología',
        stock: 45
      }
    ];

    const products = await Product.insertMany(demoProducts);
    res.json({ message: `${products.length} productos de demo cargados`, products });
  } catch (error) {
    res.status(500).json({ message: 'Error al cargar demo', error: error.message });
  }
});

module.exports = router;
