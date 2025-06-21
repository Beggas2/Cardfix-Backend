import { Router } from 'express';
import {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
  generateCards,
} from '../controllers/cardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Card CRUD
router.post('/', createCard);
router.get('/', getCards);
router.get('/:id', getCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

// AI card generation
router.post('/generate', generateCards);

export default router;

