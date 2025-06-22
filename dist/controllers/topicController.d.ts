import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const createTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTopics: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTopicStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=topicController.d.ts.map