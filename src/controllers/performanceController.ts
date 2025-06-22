import { Request, Response } from 'express';
import { performanceAnalysisService } from '../services/performanceAnalysisService';
import { successResponse, errorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getContestPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const userId = req.user!.id;

    const performance = await performanceAnalysisService.getContestPerformance(userId, contestId);
    
    return successResponse(res, performance, 'Contest performance retrieved successfully');
  } catch (error) {
    console.error('Error getting contest performance:', error);
    return errorResponse(res, 'Failed to get contest performance', 500);
  }
};

export const getTopicPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const userId = req.user!.id;

    const performance = await performanceAnalysisService.getTopicPerformance(userId, topicId);
    
    return successResponse(res, performance, 'Topic performance retrieved successfully');
  } catch (error) {
    console.error('Error getting topic performance:', error);
    return errorResponse(res, 'Failed to get topic performance', 500);
  }
};

export const getSubtopicPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subtopicId } = req.params;
    const userId = req.user!.id;

    const performance = await performanceAnalysisService.getSubtopicPerformance(userId, subtopicId);
    
    return successResponse(res, performance, 'Subtopic performance retrieved successfully');
  } catch (error) {
    console.error('Error getting subtopic performance:', error);
    return errorResponse(res, 'Failed to get subtopic performance', 500);
  }
};

export const getOverallPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const performance = await performanceAnalysisService.getOverallPerformance(userId);
    
    return successResponse(res, performance, 'Overall performance retrieved successfully');
  } catch (error) {
    console.error('Error getting overall performance:', error);
    return errorResponse(res, 'Failed to get overall performance', 500);
  }
};

export const getPerformanceComparison = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contestIds } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(contestIds) || contestIds.length === 0) {
      return errorResponse(res, 'Contest IDs array is required', 400);
    }

    const comparisons = [];
    for (const contestId of contestIds) {
      try {
        const performance = await performanceAnalysisService.getContestPerformance(userId, contestId);
        comparisons.push(performance);
      } catch (error) {
        console.error(`Error getting performance for contest ${contestId}:`, error);
        // Continue with other contests even if one fails
      }
    }
    
    return successResponse(res, comparisons, 'Performance comparison retrieved successfully');
  } catch (error) {
    console.error('Error getting performance comparison:', error);
    return errorResponse(res, 'Failed to get performance comparison', 500);
  }
};

export const getStudyInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { contestId, period = '30' } = req.query;

    // Get performance data for the specified period
    const periodDays = parseInt(period as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    let performance;
    if (contestId) {
      performance = await performanceAnalysisService.getContestPerformance(userId, contestId as string);
    } else {
      performance = await performanceAnalysisService.getOverallPerformance(userId);
    }

    // Generate insights based on performance data
    const insights = generateStudyInsights(performance, periodDays);
    
    return successResponse(res, insights, 'Study insights retrieved successfully');
  } catch (error) {
    console.error('Error getting study insights:', error);
    return errorResponse(res, 'Failed to get study insights', 500);
  }
};

function generateStudyInsights(performance: any, periodDays: number) {
  const insights = [];

  // Accuracy insights
  if (performance.accuracy < 70) {
    insights.push({
      type: 'warning',
      title: 'Baixa Taxa de Acerto',
      message: `Sua taxa de acerto está em ${performance.accuracy.toFixed(1)}%. Considere revisar os conceitos básicos antes de continuar.`,
      actionable: true,
      action: 'Revisar cards com mais frequência'
    });
  } else if (performance.accuracy > 85) {
    insights.push({
      type: 'success',
      title: 'Excelente Desempenho!',
      message: `Parabéns! Sua taxa de acerto está em ${performance.accuracy.toFixed(1)}%. Continue assim!`,
      actionable: false
    });
  }

  // Study frequency insights
  if (performance.streakDays === 0) {
    insights.push({
      type: 'info',
      title: 'Retome os Estudos',
      message: 'Você não estudou recentemente. A consistência é fundamental para o aprendizado.',
      actionable: true,
      action: 'Estudar pelo menos 15 minutos hoje'
    });
  } else if (performance.streakDays >= 7) {
    insights.push({
      type: 'success',
      title: 'Sequência Impressionante!',
      message: `Você está estudando há ${performance.streakDays} dias consecutivos. Excelente disciplina!`,
      actionable: false
    });
  }

  // Study time insights
  const avgDailyTime = performance.totalStudyTime / (periodDays * 60); // Convert to minutes per day
  if (avgDailyTime < 15) {
    insights.push({
      type: 'warning',
      title: 'Tempo de Estudo Baixo',
      message: `Você está estudando em média ${avgDailyTime.toFixed(1)} minutos por dia. Tente aumentar para pelo menos 30 minutos.`,
      actionable: true,
      action: 'Definir meta de 30 minutos diários'
    });
  }

  // Progress insights
  if (performance.topicPerformance) {
    const weakTopics = performance.topicPerformance
      .filter((topic: any) => topic.accuracy < 60)
      .sort((a: any, b: any) => a.accuracy - b.accuracy)
      .slice(0, 3);

    if (weakTopics.length > 0) {
      insights.push({
        type: 'info',
        title: 'Temas que Precisam de Atenção',
        message: `Foque nos temas: ${weakTopics.map((t: any) => t.topicName).join(', ')}`,
        actionable: true,
        action: 'Revisar estes temas prioritariamente'
      });
    }
  }

  // Response time insights
  if (performance.averageResponseTime > 60) {
    insights.push({
      type: 'info',
      title: 'Tempo de Resposta',
      message: 'Você está levando mais tempo para responder. Isso pode indicar necessidade de mais prática.',
      actionable: true,
      action: 'Praticar respostas mais rápidas'
    });
  }

  return insights;
}

