import { Router } from 'express';
import {
  uploadEdital,
  processEdital,
  getEditalFile,
  deleteEdital,
  getProcessingStatus,
} from '../controllers/editalController';
import { authenticateToken } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Edital management
router.post('/:contestId/upload', uploadSingle, uploadEdital);
router.post('/:contestId/process', processEdital);
router.get('/:contestId/status', getProcessingStatus);
router.get('/:contestId/file', getEditalFile);
router.delete('/:contestId', deleteEdital);

export default router;

