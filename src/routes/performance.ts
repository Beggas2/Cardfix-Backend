import { Router } from 'express';
import {
  getOverallPerformance,
  getTopicPerformance,
  getStudyProgress,
  getUpcomingReviews,
  getContestComparison,
} from '../controllers/performanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Performance endpoints
router.get('/overall', getOverallPerformance);
router.get('/topics', getTopicPerformance);
router.get('/progress', getStudyProgress);
router.get('/upcoming-reviews', getUpcomingReviews);
router.get('/contest-comparison', getContestComparison);

export default router;

