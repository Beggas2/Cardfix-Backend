import { Router } from 'express';
import {
  createSubtopic,
  getSubtopics,
  getSubtopic,
  updateSubtopic,
  deleteSubtopic,
  getSubtopicStats,
} from '../controllers/subtopicController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Subtopic CRUD
router.post('/', createSubtopic);
router.get('/', getSubtopics);
router.get('/:id', getSubtopic);
router.put('/:id', updateSubtopic);
router.delete('/:id', deleteSubtopic);

// Subtopic statistics
router.get('/:id/stats', getSubtopicStats);

export default router;

