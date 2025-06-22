import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const getTopics: (req: Request, res: Response) => Promise<void>;
export declare const getTopic: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubtopics: (req: Request, res: Response) => Promise<void>;
export declare const getSubtopic: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSubtopic: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=topicController.d.ts.map