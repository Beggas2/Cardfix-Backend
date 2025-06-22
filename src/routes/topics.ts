import { Router } from 'express';
import {
  createTopic,
  getTopics,
  getTopic,
  updateTopic,
  deleteTopic,
  getTopicStats,
} from '../controllers/topicController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getTopics);
router.get('/:id', getTopic);

// Routes requiring authentication
router.use(authenticateToken);
router.post('/', createTopic);
router.put('/:id', updateTopic);
router.delete('/:id', deleteTopic);
router.get('/:id/stats', getTopicStats);

export default router;

