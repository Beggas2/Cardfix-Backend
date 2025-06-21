import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthRequest, AuthResponse } from '../types';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name }: AuthRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        createErrorResponse('Email e senha são obrigatórios')
      );
    }

    if (password.length < 6) {
      return res.status(400).json(
        createErrorResponse('Senha deve ter pelo menos 6 caracteres')
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json(
        createErrorResponse('Usuário já existe com este email')
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        subscriptionTier: 'free',
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier as 'free' | 'paid',
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier as 'free' | 'paid',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };

    res.status(201).json(
      createSuccessResponse(response, 'Usuário criado com sucesso')
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: AuthRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        createErrorResponse('Email e senha são obrigatórios')
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json(
        createErrorResponse('Credenciais inválidas')
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(
        createErrorResponse('Credenciais inválidas')
      );
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier as 'free' | 'paid',
    });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscriptionTier as 'free' | 'paid',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };

    res.json(
      createSuccessResponse(response, 'Login realizado com sucesso')
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse('Usuário não encontrado')
      );
    }

    res.json(
      createSuccessResponse(user, 'Perfil recuperado com sucesso')
    );
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(
      createSuccessResponse(user, 'Perfil atualizado com sucesso')
    );
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

