import { Router } from 'express';
import {
  createContest,
  getContests,
  getContest,
  updateContest,
  deleteContest,
  addTopicToContest,
  removeTopicFromContest,
} from '../controllers/contestController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Contest CRUD
router.post('/', createContest);
router.get('/', getContests);
router.get('/:id', getContest);
router.put('/:id', updateContest);
router.delete('/:id', deleteContest);

// Contest topics
router.post('/:contestId/topics', addTopicToContest);
router.delete('/:contestId/topics/:topicId', removeTopicFromContest);

export default router;

