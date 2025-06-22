import { Router } from 'express';
import {
  reviewCard,
  getCardsForReview,
  getLearningProgress,
  getStudyHistory,
  getNextReviewCard,
} from '../controllers/studyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Study session management
router.post('/review', reviewCard);
router.get('/cards-for-review', getCardsForReview);
router.get('/learning-progress', getLearningProgress);
router.get('/history', getStudyHistory);
router.get('/next-review-card', getNextReviewCard);

export default router;


