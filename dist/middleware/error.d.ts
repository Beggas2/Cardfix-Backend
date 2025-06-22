import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const notFound: (req: Request, res: Response) => void;
//# sourceMappingURL=error.d.ts.map