import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getWishlist, addWishlistItem, removeWishlistItem } from '../controllers/wishlistController.js';

const router = Router();

router.get('/', protect, getWishlist);
router.post('/:productId', protect, addWishlistItem);
router.delete('/:productId', protect, removeWishlistItem);

export default router;
