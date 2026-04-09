const express = require('express');
const upload  = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/upload
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió imagen' });
    res.json({ url: req.file.path }); // Cloudinary devuelve la URL en req.file.path
  } catch (error) {
    res.status(500).json({ message: 'Error al subir imagen', error: error.message });
  }
});

module.exports = router;