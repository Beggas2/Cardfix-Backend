import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getContestPerformance,
  getTopicPerformance,
  getSubtopicPerformance,
  getOverallPerformance,
  getPerformanceComparison,
  getStudyInsights
} from '../controllers/performanceController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get overall performance across all contests
router.get('/overall', getOverallPerformance);

// Get performance for a specific contest
router.get('/contest/:contestId', getContestPerformance);

// Get performance for a specific topic
router.get('/topic/:topicId', getTopicPerformance);

// Get performance for a specific subtopic
router.get('/subtopic/:subtopicId', getSubtopicPerformance);

// Compare performance across multiple contests
router.post('/compare', getPerformanceComparison);

// Get study insights and recommendations
router.get('/insights', getStudyInsights);

export default router;

