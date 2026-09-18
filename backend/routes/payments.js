import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { createStkPush, stkCallback, getStkStatus } from '../controllers/paymentController.js';

const router = Router();

router.post('/mpesa/stk', protect, createStkPush);
router.get('/mpesa/status/:id', protect, getStkStatus);
router.post('/mpesa/callback', stkCallback);

export default router;
