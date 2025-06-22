import { Router } from 'express';
import {
  getOverallPerformance,
  getPerformanceByTopic,
  getPerformanceBySubtopic,
  getDailyPerformance,
} from '../controllers/performanceController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Performance routes
router.get('/overall', getOverallPerformance);
router.get('/topic', getPerformanceByTopic);
router.get('/subtopic', getPerformanceBySubtopic);
router.get('/daily', getDailyPerformance);

export default router;


