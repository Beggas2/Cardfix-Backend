import { Router } from 'express';
import {
  getTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  getSubtopics,
  getSubtopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
} from '../controllers/topicController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes (read-only)
router.get('/topics', getTopics);
router.get('/topics/:id', getTopic);
router.get('/subtopics', getSubtopics);
router.get('/subtopics/:id', getSubtopic);

// Protected routes (require authentication)
router.use(authenticateToken);

// Topic management
router.post('/topics', createTopic);
router.put('/topics/:id', updateTopic);
router.delete('/topics/:id', deleteTopic);

// Subtopic management
router.post('/subtopics', createSubtopic);
router.put('/subtopics/:id', updateSubtopic);
router.delete('/subtopics/:id', deleteSubtopic);

export default router;

