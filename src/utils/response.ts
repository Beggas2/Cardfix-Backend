import { ApiResponse } from '../types';

export const createResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
): ApiResponse<T> => {
  return {
    success,
    data,
    message,
    error,
  };
};

export const createSuccessResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return createResponse(true, data, message);
};

export const createErrorResponse = (
  error: string,
  message?: string
): ApiResponse => {
  return createResponse(false, undefined, message, error);
};

