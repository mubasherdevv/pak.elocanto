import express from 'express';
import {
  authUser, googleAuth, registerUser, verifyEmail, resendVerification,
  forgotPassword, resetPassword, getUserProfile, updateUserProfile,
  getPublicProfile, getAllUsersAdmin, toggleBanUser,
  adminCreateUser, adminUpdateUser, adminDeleteUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { loginRateLimiter, forgotPasswordRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.route('/').post(registerUser);
router.post('/login', loginRateLimiter, authUser);
router.post('/google', googleAuth);
router.post('/verify', verifyEmail);
router.post('/resend-verify', resendVerification);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

// Admin Routes
router.get('/admin/all', protect, admin, getAllUsersAdmin);
router.post('/admin/create', protect, admin, adminCreateUser);
router.route('/admin/:id')
  .put(protect, admin, adminUpdateUser)
  .delete(protect, admin, adminDeleteUser);
router.put('/admin/:id/ban', protect, admin, toggleBanUser);

router.get('/:id/public', getPublicProfile);

export default router;