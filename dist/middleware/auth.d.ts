import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const requireSubscription: (tier: "free" | "paid") => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map