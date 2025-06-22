import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReviewCardRequest, GenerateCardsRequest } from '../types';
import { advancedAIService } from '../services/advancedAIService';

export const reviewCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { cardId, quality }: ReviewCardRequest = req.body;

    if (quality < 0 || quality > 5) {
      return res.status(400).json(createErrorResponse('Qualidade da revisão inválida (0-5)'));
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        subtopic: {
          include: {
            topic: {
              include: {
                contestTopics: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json(createErrorResponse('Card não encontrado'));
    }

    // Find the contest associated with this card through its topic
    const contestTopic = card.subtopic.topic.contestTopics.find(ct => ct.userId === userId);
    if (!contestTopic) {
      return res.status(404).json(createErrorResponse('Concurso associado ao card não encontrado para este usuário'));
    }
    const contestId = contestTopic.contestId;

    // Get or create UserCard entry
    let userCard = await prisma.userCard.findUnique({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
    });

    let repetitions = userCard ? userCard.repetitions : 0;
    let easeFactor = userCard ? userCard.easeFactor : 2.5;
    let interval = userCard ? userCard.interval : 0;
    let correctStreak = userCard ? userCard.correctStreak : 0;
    let incorrectStreak = userCard ? userCard.incorrectStreak : 0;
    let totalCorrectReviews = userCard ? userCard.totalCorrectReviews : 0;
    let totalIncorrectReviews = userCard ? userCard.totalIncorrectReviews : 0;
    let status: 'new' | 'learning' | 'review' | 'graduated' = userCard ? userCard.status as 'new' | 'learning' | 'review' | 'graduated' : 'new'; // Asserção de tipo adicionada

    // SM-2 algorithm logic
    if (quality >= 3) {
      correctStreak++;
      incorrectStreak = 0;
      totalCorrectReviews++;

      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    } else {
      repetitions = 0;
      interval = 1;
      correctStreak = 0;
      incorrectStreak++;
      totalIncorrectReviews++;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    repetitions++;

    const nextReviewTime = new Date();
    nextReviewTime.setDate(nextReviewTime.getDate() + interval);

    if (interval >= 21 && quality >= 3) {
      status = 'graduated';
    } else if (repetitions > 0 && quality >= 3) {
      status = 'review';
    } else {
      status = 'learning';
    }

    userCard = await prisma.userCard.upsert({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
      update: {
        repetitions,
        easeFactor,
        interval,
        nextReviewTime,
        lastReviewed: new Date(),
        correctStreak,
        incorrectStreak,
        totalCorrectReviews,
        totalIncorrectReviews,
        status,
      },
      create: {
        userId,
        cardId,
        contestId, // Associate with the contest
        subtopicId: card.subtopicId,
        repetitions,
        easeFactor,
        interval,
        nextReviewTime,
        lastReviewed: new Date(),
        correctStreak,
        incorrectStreak,
        totalCorrectReviews,
        totalIncorrectReviews,
        status,
      },
      include: {
        card: true,
      },
    });

    // Record study session
    await prisma.studySession.create({
      data: {
        userId,
        cardId,
        contestId,
        subtopicId: card.subtopicId,
        quality, // Campo 'quality' agora é reconhecido
        repetitions,
        easeFactor,
        interval,
        reviewTime: new Date(),
        correct: quality >= 3,
      },
    });

    res.json(createSuccessResponse(userCard, 'Card revisado com sucesso'));
  } catch (error) {
    console.error('Review card error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getCardsForReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { contestId, subtopicId } = req.query;

    const whereClause: any = {
      userId,
      nextReviewTime: { lte: new Date() },
    };

    if (contestId) {
      whereClause.contestId = contestId as string;
    }
    if (subtopicId) {
      whereClause.subtopicId = subtopicId as string;
    }

    const cardsToReview = await prisma.userCard.findMany({
      where: whereClause,
      include: {
        card: {
          include: {
            subtopic: {
              include: {
                topic: true,
              },
            },
          },
        },
      },
      orderBy: { nextReviewTime: 'asc' },
      take: 20, // Limit to 20 cards for review at a time
    });

    res.json(createSuccessResponse(cardsToReview, 'Cards para revisão recuperados com sucesso'));
  } catch (error) {
    console.error('Get cards for review error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getLearningProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { contestId, subtopicId } = req.query;

    const whereClause: any = {
      userId,
    };

    if (contestId) {
      whereClause.contestId = contestId as string;
    }
    if (subtopicId) {
      whereClause.subtopicId = subtopicId as string;
    }

    const totalCards = await prisma.userCard.count({
      where: whereClause,
    });

    const newCards = await prisma.userCard.count({
      where: { ...whereClause, status: 'new' },
    });

    const learningCards = await prisma.userCard.count({
      where: { ...whereClause, status: 'learning' },
    });

    const reviewCards = await prisma.userCard.count({
      where: { ...whereClause, status: 'review' },
    });

    const graduatedCards = await prisma.userCard.count({
      where: { ...whereClause, status: 'graduated' },
    });

    const progress = {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      graduatedCards,
    };

    res.json(createSuccessResponse(progress, 'Progresso de aprendizado recuperado com sucesso'));
  } catch (error) {
    console.error('Get learning progress error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getStudyHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { contestId, subtopicId, limit = '100' } = req.query;

    const whereClause: any = {
      userId,
    };

    if (contestId) {
      whereClause.contestId = contestId as string;
    }
    if (subtopicId) {
      whereClause.subtopicId = subtopicId as string;
    }

    const history = await prisma.studySession.findMany({
      where: whereClause,
      include: {
        card: {
          include: {
            subtopic: {
              include: {
                topic: true,
              },
            },
          },
        },
      },
      orderBy: { reviewTime: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(createSuccessResponse(history, 'Histórico de estudo recuperado com sucesso'));
  } catch (error) {
    console.error('Get study history error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};

export const getNextReviewCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Alterado de userId para id
    const { contestId, subtopicId } = req.query;

    const whereClause: any = {
      userId,
      nextReviewTime: { lte: new Date() },
    };

    if (contestId) {
      whereClause.contestId = contestId as string;
    }
    if (subtopicId) {
      whereClause.subtopicId = subtopicId as string;
    }

    const nextCard = await prisma.userCard.findFirst({
      where: whereClause,
      include: {
        card: {
          include: {
            subtopic: {
              include: {
                topic: true,
              },
            },
          },
        },
      },
      orderBy: { nextReviewTime: 'asc' },
    });

    res.json(createSuccessResponse(nextCard, 'Próximo card para revisão recuperado com sucesso'));
  } catch (error) {
    console.error('Get next review card error:', error);
    res.status(500).json(createErrorResponse('Erro interno do servidor', (error as Error).message));
  }
};


