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

// All routes require authentication
router.use(authenticateToken);

// Topic CRUD
router.post('/', createTopic);
router.get('/', getTopics);
router.get('/:id', getTopic);
router.put('/:id', updateTopic);
router.delete('/:id', deleteTopic);

// Topic statistics
router.get('/:id/stats', getTopicStats);

export default router;

