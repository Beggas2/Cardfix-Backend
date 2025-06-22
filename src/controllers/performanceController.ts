import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getOverallPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.query;

    // Build where clause for filtering by contest if provided
    const whereClause: any = { userId };
    if (contestId) {
      whereClause.contestId = contestId as string;
    }

    // Get all user cards with related data
    const userCards = await prisma.userCard.findMany({
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
        contest: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate overall statistics
    const totalCards = userCards.length;
    const studiedCards = userCards.filter(uc => 
      uc.totalCorrectReviews > 0 || uc.totalIncorrectReviews > 0
    ).length;
    const totalCorrectReviews = userCards.reduce((sum, uc) => sum + uc.totalCorrectReviews, 0);
    const totalIncorrectReviews = userCards.reduce((sum, uc) => sum + uc.totalIncorrectReviews, 0);
    const totalReviews = totalCorrectReviews + totalIncorrectReviews;
    const averageAccuracy = totalReviews > 0 ? (totalCorrectReviews / totalReviews) * 100 : 0;

    // Calculate study streak (consecutive days with reviews)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let studyStreak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const reviewsOnDay = userCards.filter(uc => 
        uc.lastReviewed && 
        uc.lastReviewed >= dayStart && 
        uc.lastReviewed <= dayEnd
      ).length;

      if (reviewsOnDay > 0) {
        studyStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Group by status
    const statusDistribution = {
      new: userCards.filter(uc => uc.status === 'new').length,
      learning: userCards.filter(uc => uc.status === 'learning').length,
      review: userCards.filter(uc => uc.status === 'review').length,
      graduated: userCards.filter(uc => uc.status === 'graduated').length,
    };

    // Group by difficulty
    const difficultyDistribution = {
      easy: userCards.filter(uc => uc.card.difficulty === 'easy').length,
      medium: userCards.filter(uc => uc.card.difficulty === 'medium').length,
      hard: userCards.filter(uc => uc.card.difficulty === 'hard').length,
    };

    const performance = {
      totalCards,
      studiedCards,
      totalCorrectReviews,
      totalIncorrectReviews,
      totalReviews,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      studyStreak,
      statusDistribution,
      difficultyDistribution,
    };

    res.json(
      createSuccessResponse(performance, 'Performance geral recuperada com sucesso')
    );
  } catch (error) {
    console.error('Get overall performance error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getTopicPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.query;

    // Build where clause
    const whereClause: any = { userId };
    if (contestId) {
      whereClause.contestId = contestId as string;
    }

    // Get user cards grouped by topic
    const userCards = await prisma.userCard.findMany({
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
    });

    // Group by topic
    const topicMap = new Map();

    userCards.forEach(uc => {
      const topic = uc.card.subtopic.topic;
      const topicId = topic.id;

      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, {
          topicId,
          topicName: topic.name,
          totalCards: 0,
          studiedCards: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          subtopics: new Map(),
        });
      }

      const topicData = topicMap.get(topicId);
      topicData.totalCards++;
      
      if (uc.totalCorrectReviews > 0 || uc.totalIncorrectReviews > 0) {
        topicData.studiedCards++;
      }
      
      topicData.correctAnswers += uc.totalCorrectReviews;
      topicData.incorrectAnswers += uc.totalIncorrectReviews;

      // Group by subtopic within topic
      const subtopicId = uc.card.subtopic.id;
      if (!topicData.subtopics.has(subtopicId)) {
        topicData.subtopics.set(subtopicId, {
          subtopicId,
          subtopicName: uc.card.subtopic.name,
          totalCards: 0,
          studiedCards: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
        });
      }

      const subtopicData = topicData.subtopics.get(subtopicId);
      subtopicData.totalCards++;
      
      if (uc.totalCorrectReviews > 0 || uc.totalIncorrectReviews > 0) {
        subtopicData.studiedCards++;
      }
      
      subtopicData.correctAnswers += uc.totalCorrectReviews;
      subtopicData.incorrectAnswers += uc.totalIncorrectReviews;
    });

    // Convert to array and calculate percentages
    const topicPerformance = Array.from(topicMap.values()).map(topic => {
      const totalReviews = topic.correctAnswers + topic.incorrectAnswers;
      const accuracy = totalReviews > 0 ? (topic.correctAnswers / totalReviews) * 100 : 0;
      
      const subtopicPerformance = Array.from(topic.subtopics.values()).map((subtopic: any) => {
        const subtopicTotalReviews = subtopic.correctAnswers + subtopic.incorrectAnswers;
        const subtopicAccuracy = subtopicTotalReviews > 0 
          ? (subtopic.correctAnswers / subtopicTotalReviews) * 100 
          : 0;

        return {
          ...subtopic,
          accuracy: Math.round(subtopicAccuracy * 100) / 100,
          totalReviews: subtopicTotalReviews,
        };
      });

      return {
        topicId: topic.topicId,
        topicName: topic.topicName,
        totalCards: topic.totalCards,
        studiedCards: topic.studiedCards,
        correctAnswers: topic.correctAnswers,
        incorrectAnswers: topic.incorrectAnswers,
        totalReviews,
        accuracy: Math.round(accuracy * 100) / 100,
        subtopicPerformance,
      };
    });

    res.json(
      createSuccessResponse(topicPerformance, 'Performance por tópico recuperada com sucesso')
    );
  } catch (error) {
    console.error('Get topic performance error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getStudyProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId, days = 30 } = req.query;

    const daysNumber = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);
    startDate.setHours(0, 0, 0, 0);

    // Build where clause
    const whereClause: any = { 
      userId,
      lastReviewed: {
        gte: startDate,
      },
    };
    if (contestId) {
      whereClause.contestId = contestId as string;
    }

    // Get user cards with reviews in the specified period
    const userCards = await prisma.userCard.findMany({
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
    });

    // Group by date
    const dailyProgress = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const reviewsOnDay = userCards.filter(uc => 
        uc.lastReviewed && 
        uc.lastReviewed >= dayStart && 
        uc.lastReviewed <= dayEnd
      );

      const correctReviews = reviewsOnDay.reduce((sum, uc) => sum + uc.totalCorrectReviews, 0);
      const incorrectReviews = reviewsOnDay.reduce((sum, uc) => sum + uc.totalIncorrectReviews, 0);
      const totalReviews = correctReviews + incorrectReviews;
      const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

      dailyProgress.push({
        date: currentDate.toISOString().split('T')[0],
        cardsStudied: reviewsOnDay.length,
        correctReviews,
        incorrectReviews,
        totalReviews,
        accuracy: Math.round(accuracy * 100) / 100,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(
      createSuccessResponse(dailyProgress, 'Progresso de estudos recuperado com sucesso')
    );
  } catch (error) {
    console.error('Get study progress error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getUpcomingReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId, limit = 50 } = req.query;

    const limitNumber = parseInt(limit as string);
    const now = new Date();

    // Build where clause
    const whereClause: any = { 
      userId,
      nextReview: {
        lte: now,
      },
    };
    if (contestId) {
      whereClause.contestId = contestId as string;
    }

    // Get cards due for review
    const upcomingReviews = await prisma.userCard.findMany({
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
        contest: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { nextReview: 'asc' },
        { status: 'asc' },
      ],
      take: limitNumber,
    });

    const reviewData = upcomingReviews.map(uc => ({
      userCardId: uc.id,
      cardId: uc.card.id,
      front: uc.card.front,
      difficulty: uc.card.difficulty,
      status: uc.status,
      nextReview: uc.nextReview,
      repetitions: uc.repetitions,
      correctStreak: uc.correctStreak,
      incorrectStreak: uc.incorrectStreak,
      subtopic: {
        id: uc.card.subtopic.id,
        name: uc.card.subtopic.name,
      },
      topic: {
        id: uc.card.subtopic.topic.id,
        name: uc.card.subtopic.topic.name,
      },
      contest: uc.contest,
    }));

    res.json(
      createSuccessResponse(reviewData, 'Revisões pendentes recuperadas com sucesso')
    );
  } catch (error) {
    console.error('Get upcoming reviews error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getContestComparison = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all contests for the user with performance data
    const contests = await prisma.contest.findMany({
      where: { userId },
      include: {
        userCards: {
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
        },
        _count: {
          select: {
            userCards: true,
          },
        },
      },
    });

    const contestComparison = contests.map(contest => {
      const userCards = contest.userCards;
      const totalCards = userCards.length;
      const studiedCards = userCards.filter(uc => 
        uc.totalCorrectReviews > 0 || uc.totalIncorrectReviews > 0
      ).length;
      const correctReviews = userCards.reduce((sum, uc) => sum + uc.totalCorrectReviews, 0);
      const incorrectReviews = userCards.reduce((sum, uc) => sum + uc.totalIncorrectReviews, 0);
      const totalReviews = correctReviews + incorrectReviews;
      const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

      // Calculate progress percentage
      const progress = totalCards > 0 ? (studiedCards / totalCards) * 100 : 0;

      return {
        contestId: contest.id,
        contestName: contest.name,
        examDate: contest.examDate,
        targetDate: contest.targetDate,
        totalCards,
        studiedCards,
        correctReviews,
        incorrectReviews,
        totalReviews,
        accuracy: Math.round(accuracy * 100) / 100,
        progress: Math.round(progress * 100) / 100,
        createdAt: contest.createdAt,
      };
    });

    res.json(
      createSuccessResponse(contestComparison, 'Comparação entre concursos recuperada com sucesso')
    );
  } catch (error) {
    console.error('Get contest comparison error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

