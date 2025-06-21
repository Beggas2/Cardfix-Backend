import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '../utils/response';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(400).json(
      createErrorResponse('Dados duplicados. Este registro já existe.')
    );
  }

  if (error.code === 'P2025') {
    return res.status(404).json(
      createErrorResponse('Registro não encontrado.')
    );
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json(
      createErrorResponse('Dados inválidos', error.message)
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json(
      createErrorResponse('Token inválido')
    );
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json(
      createErrorResponse('Token expirado')
    );
  }

  // Default error
  res.status(500).json(
    createErrorResponse('Erro interno do servidor', error.message)
  );
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json(
    createErrorResponse(`Rota não encontrada: ${req.originalUrl}`)
  );
};

