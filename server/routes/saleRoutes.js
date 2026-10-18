import express from 'express';
import { getSales, createSale, deleteSale } from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSales)
  .post(protect, createSale);

router.route('/:id')
  .delete(protect, deleteSale);

export default router;
