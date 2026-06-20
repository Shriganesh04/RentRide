const express = require('express');
const router = express.Router();
const {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getFeaturedCars,
  uploadCarImages,
  deleteCarImage,
} = require('../controllers/carController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllCars);
router.get('/featured', getFeaturedCars);
router.get('/:id', getCarById);

// Admin routes
router.post('/', protect, authorize('admin'), createCar);
router.put('/:id', protect, authorize('admin'), updateCar);
router.delete('/:id', protect, authorize('admin'), deleteCar);

// Image upload — admin only, up to 6 files per request
router.post(
  '/upload-images',
  protect,
  authorize('admin'),
  upload.array('images', 6),
  uploadCarImages
);
router.delete('/upload-images', protect, authorize('admin'), deleteCarImage);

module.exports = router;