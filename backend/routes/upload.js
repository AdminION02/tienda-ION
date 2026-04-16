const express = require('express');
const upload  = require('../middleware/upload');
const { protect, adminOnly } = require('../middleware/auth');
const multer  = require('multer');

const router = express.Router();

// POST /api/upload
router.post('/', protect, adminOnly, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error propio de Multer (ej: archivo muy grande)
      return res.status(400).json({ message: `Error de carga: ${err.message}` });
    }
    if (err) {
      // Error de filtro (tipo de archivo no permitido) u otro
      return res.status(400).json({ message: err.message || 'Archivo no válido' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }

    // Cloudinary devuelve la URL pública en req.file.path
    res.status(201).json({
      url:      req.file.path,
      filename: req.file.filename,       // public_id en Cloudinary
      mimetype: req.file.mimetype,
      size:     req.file.size,
    });
  });
});

module.exports = router;