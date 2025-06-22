import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  generateCards,
  bulkDeleteCards,
} from '../controllers/cardController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Card routes
router.post('/', createCard);
router.get('/', getCards);
router.get('/:id', getCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

// Bulk operations
router.delete('/bulk/delete', bulkDeleteCards);

// AI generation
router.post('/generate', generateCards);

export default router;
