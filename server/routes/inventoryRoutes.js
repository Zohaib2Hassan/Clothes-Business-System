import express from 'express';
import {
  getInventory,
  getLowStock,
  updateStock
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.put('/update-stock', updateStock);

export default router;
