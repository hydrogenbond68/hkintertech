import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import { createInquiry, getUserInquiries, getAllInquiries, replyToInquiry } from '../controllers/inquiryController.js';

const router = Router();

router.post('/', protect, createInquiry);
router.get('/user', protect, getUserInquiries);
router.get('/all', protect, admin, getAllInquiries);
router.post('/:id/reply', protect, admin, replyToInquiry);

export default router;
