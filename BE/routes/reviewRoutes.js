import express from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== REVIEW ROUTES ====================
router.post('/', authMiddleware, ReviewController.submitReview);
router.get('/user/:store_id', authMiddleware, ReviewController.getUserReview);
router.get('/store/:store_id', ReviewController.getStoreReviews);
router.delete('/:store_id', authMiddleware, ReviewController.deleteReview);

export default router;