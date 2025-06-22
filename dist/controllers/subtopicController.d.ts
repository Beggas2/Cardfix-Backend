import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const createSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubtopics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubtopicStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=subtopicController.d.ts.map