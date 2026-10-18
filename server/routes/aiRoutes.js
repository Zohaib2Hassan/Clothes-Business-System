import express from 'express';
import { chatWithAI, getPredictions, updateModelPredictions, getInsights, explainPredictions } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', chatWithAI);
router.get('/predictions', getPredictions);
router.post('/predictions/update-model', updateModelPredictions);
router.post('/predictions/explain', explainPredictions);
router.get('/insights', getInsights);

export default router;
