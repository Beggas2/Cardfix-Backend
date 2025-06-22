import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getContestPerformance: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const getTopicPerformance: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const getSubtopicPerformance: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const getOverallPerformance: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const getPerformanceComparison: (req: AuthenticatedRequest, res: Response) => Promise<any>;
export declare const getStudyInsights: (req: AuthenticatedRequest, res: Response) => Promise<any>;
//# sourceMappingURL=performanceController.d.ts.map