import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { createErrorResponse } from '../utils/response';
import { JwtPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(createErrorResponse('Token de acesso requerido'));
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Token inválido'));
  }
};

export const requireSubscription = (tier: 'free' | 'paid') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Usuário não autenticado'));
    }

    if (tier === 'paid' && req.user.subscriptionTier === 'free') {
      return res.status(403).json(
        createErrorResponse('Assinatura premium requerida para esta funcionalidade')
      );
    }

    next();
  };
};

