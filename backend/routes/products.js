import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  getProducts,
  getProduct,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
} from '../controllers/productController.js';

const router = Router();

const catalogHeaders = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30, stale-if-error=60');
  res.set('CDN-Cache-Status', 'SWR-READY');
  next();
};

router.get('/', catalogHeaders, getProducts);
router.get('/categories', catalogHeaders, getCategories);
router.get('/:id', catalogHeaders, getProduct);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/bulk-update', protect, admin, bulkUpdateProducts);

export default router;
