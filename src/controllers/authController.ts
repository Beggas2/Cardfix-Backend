import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/auth';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthRequest, AuthenticatedRequest, JwtPayload } from '../types';
import { generateToken } from '../utils/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password }: AuthRequest = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email e senha são obrigatórios'));
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscriptionTier: 'free',
      },
    });

    const tokenPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier as 'free' | 'paid', // Adicionado asserção de tipo
    };
    const token = generateToken(tokenPayload);

    res.status(201).json(createSuccessResponse({ user, token }, 'Usuário registrado com sucesso'));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: AuthRequest = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email e senha são obrigatórios'));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json(createErrorResponse('Credenciais inválidas'));
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json(createErrorResponse('Credenciais inválidas'));
    }

    const tokenPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier as 'free' | 'paid', // Adicionado asserção de tipo
    };
    const token = generateToken(tokenPayload);

    res.status(200).json(createSuccessResponse({ user, token }, 'Login realizado com sucesso'));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, subscriptionTier: true },
    });

    if (!user) {
      return res.status(404).json(createErrorResponse('Usuário não encontrado'));
    }

    res.json(createSuccessResponse(user, 'Perfil do usuário recuperado com sucesso'));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, name: true, email: true, subscriptionTier: true },
    });

    res.json(createSuccessResponse(updatedUser, 'Perfil do usuário atualizado com sucesso'));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};


