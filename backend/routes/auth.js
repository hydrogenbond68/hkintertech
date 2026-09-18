import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  register,
  login,
  me,
  updateProfile,
  forgotPassword,
  resetPassword,
  listUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, admin, listUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
