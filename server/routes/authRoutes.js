import express from 'express';
import { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  verify2FA,
  resend2FACode 
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-2fa', verify2FA);
router.post('/resend-2fa', resend2FACode);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteUserProfile);

export default router;
