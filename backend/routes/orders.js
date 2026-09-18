import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createOrder,
  getOrders,
  getOrder,
  updateStatus,
  updateLocation,
  assignAgent,
  getPaymentStatus,
  markPayment,
} from '../controllers/orderController.js';

const router = Router();

router.get('/', protect, getOrders);
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, admin, updateStatus);
router.put('/:id/location', protect, admin, updateLocation);
router.post('/:id/assign', protect, admin, assignAgent);
router.get('/:id/payment', protect, getPaymentStatus);
router.post('/:id/payment', protect, markPayment);

export default router;
