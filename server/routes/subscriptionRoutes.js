import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSubscription,
  upgradeSubscription,
  buyAiCredits,
} from '../controllers/subscriptionController.js';

const router = express.Router();

router.route('/')
  .get(protect, getSubscription);

router.route('/upgrade')
  .post(protect, upgradeSubscription);

router.route('/credits')
  .post(protect, buyAiCredits);

export default router;
