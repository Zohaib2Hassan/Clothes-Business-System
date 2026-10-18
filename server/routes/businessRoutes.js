import express from 'express';
import { getBusiness, createBusiness, updateBusiness } from '../controllers/businessController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getBusiness)
  .post(protect, createBusiness)
  .put(protect, updateBusiness);

export default router;
