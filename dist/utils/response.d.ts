import { ApiResponse } from '../types';
export declare const createResponse: <T>(success: boolean, data?: T, message?: string, error?: string) => ApiResponse<T>;
export declare const createSuccessResponse: <T>(data: T, message?: string) => ApiResponse<T>;
export declare const createErrorResponse: (error: string, message?: string) => ApiResponse;
//# sourceMappingURL=response.d.ts.map