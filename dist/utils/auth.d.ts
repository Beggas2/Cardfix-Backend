import { JwtPayload } from '../types';
export declare const generateToken: (payload: JwtPayload) => string;
export declare const verifyToken: (token: string) => JwtPayload;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateRandomString: (length?: number) => string;
//# sourceMappingURL=auth.d.ts.map