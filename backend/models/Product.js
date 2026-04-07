const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria']
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: 0
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=Producto'
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true
  },
  stock: {
    type: Number,
    default: 100,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
