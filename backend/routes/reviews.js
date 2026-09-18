import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import { getProductReviews, createReview, deleteReview, getAllReviews } from '../controllers/reviewController.js';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.get('/all', protect, admin, getAllReviews);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);

export default router;
