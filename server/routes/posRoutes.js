import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  posCheckout,
  validatePOSCart,
  getPOSProducts,
  getPOSReceipt,
  holdSale,
  getHeldSales,
  deleteHeldSale,
  getPOSSales,
  processPOSReturn,
  posAISearch,
  posAIAction,
  posAIRecommendations,
  posAICheckoutSummary,
  posMLDemandInsight,
} from '../controllers/posController.js';

const router = express.Router();

router.use(protect);

// Product Catalog & Cart Validation
router.get('/products', getPOSProducts);
router.post('/cart/validate', validatePOSCart);

// Checkout & Receipts
router.post('/checkout', posCheckout);
router.get('/receipt/:id', getPOSReceipt);

// Hold & Resume Sales
router.post('/hold', holdSale);
router.get('/held', getHeldSales);
router.delete('/held/:id', deleteHeldSale);

// Sales History & Returns / Refunds
router.get('/sales', getPOSSales);
router.post('/returns', processPOSReturn);

// AI POS Assistant & ML Insights
router.post('/ai/search', posAISearch);
router.post('/ai/action', posAIAction);
router.post('/ai/recommendations', posAIRecommendations);
router.post('/ai/summary', posAICheckoutSummary);
router.get('/ml-demand/:productId', posMLDemandInsight);

export default router;
