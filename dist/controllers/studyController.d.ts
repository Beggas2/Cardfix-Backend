import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const reviewCard: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCardsForReview: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getLearningProgress: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getStudyHistory: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getNextReviewCard: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=studyController.d.ts.map