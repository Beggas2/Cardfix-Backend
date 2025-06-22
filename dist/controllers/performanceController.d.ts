import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getOverallPerformance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPerformanceByTopic: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPerformanceBySubtopic: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getDailyPerformance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=performanceController.d.ts.map