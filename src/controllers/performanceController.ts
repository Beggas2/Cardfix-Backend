import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { performanceAnalysisService } from '../services/performanceAnalysisService';

export const getOverallPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const overallPerformance = await performanceAnalysisService.getOverallPerformance(userId);
    res.json(createSuccessResponse(overallPerformance, 'Performance geral recuperada com sucesso'));
  } catch (error) {
    console.error('Get overall performance error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getPerformanceByTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { contestId } = req.query;
    const performanceByTopic = await performanceAnalysisService.getPerformanceByTopic(userId, contestId as string);
    res.json(createSuccessResponse(performanceByTopic, 'Performance por tópico recuperada com sucesso'));
  } catch (error) {
    console.error('Get performance by topic error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getPerformanceBySubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { topicId, contestId } = req.query;
    const performanceBySubtopic = await performanceAnalysisService.getPerformanceBySubtopic(userId, topicId as string, contestId as string);
    res.json(createSuccessResponse(performanceBySubtopic, 'Performance por subtópico recuperada com sucesso'));
  } catch (error) {
    console.error('Get performance by subtopic error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getDailyPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { contestId } = req.query;
    const dailyPerformance = await performanceAnalysisService.getDailyPerformance(userId, contestId as string);
    res.json(createSuccessResponse(dailyPerformance, 'Performance diária recuperada com sucesso'));
  } catch (error) {
    console.error('Get daily performance error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};


