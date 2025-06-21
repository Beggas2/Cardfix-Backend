import { Router } from 'express';
import {
  getStudySession,
  reviewCard,
  addCardToStudy,
  removeCardFromStudy,
  getStudyStatsController,
} from '../controllers/studyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Study session management
router.get('/session/:contestId', getStudySession);
router.post('/review', reviewCard);
router.get('/stats/:contestId', getStudyStatsController);

// Card study management
router.post('/cards', addCardToStudy);
router.delete('/cards/:cardId', removeCardFromStudy);

export default router;

