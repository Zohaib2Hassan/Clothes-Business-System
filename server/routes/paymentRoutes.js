import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createPayment,
  verifyPayment,
  safepayWebhook,
} from '../controllers/paymentController.js';

const router = express.Router();

// Create a Safepay payment session (requires auth)
router.route('/create-payment')
  .post(protect, createPayment);

// Verify payment after Safepay checkout completes (requires auth)
router.route('/verify-payment')
  .post(protect, verifyPayment);

// Safepay Webhook (public - verified via signature)
router.route('/safepay-webhook')
  .post(safepayWebhook);

export default router;
