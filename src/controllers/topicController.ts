import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json(
        createErrorResponse('Nome do tópico é obrigatório')
      );
    }

    // Check if topic already exists
    const existingTopic = await prisma.topic.findUnique({
      where: { name },
    });

    if (existingTopic) {
      return res.status(409).json(
        createErrorResponse('Tópico com este nome já existe')
      );
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        name,
        description,
      },
      include: {
        subtopics: true,
        _count: {
          select: {
            subtopics: true,
            contestTopics: true,
          },
        },
      },
    });

    res.status(201).json(
      createSuccessResponse(topic, 'Tópico criado com sucesso')
    );
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getTopics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { contestId } = req.query;

    let whereClause: any = {};
    
    if (contestId) {
      whereClause.contestTopics = {
        some: {
          contestId: contestId as string,
        },
      };
    }

    const topics = await prisma.topic.findMany({
      where: whereClause,
      include: {
        subtopics: {
          include: {
            _count: {
              select: {
                cards: true,
              },
            },
          },
        },
        _count: {
          select: {
            subtopics: true,
            contestTopics: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(
      createSuccessResponse(topics, 'Tópicos recuperados com sucesso')
    );
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        subtopics: {
          include: {
            cards: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            _count: {
              select: {
                cards: true,
              },
            },
          },
        },
        contestTopics: {
          include: {
            contest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            subtopics: true,
            contestTopics: true,
          },
        },
      },
    });

    if (!topic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    res.json(
      createSuccessResponse(topic, 'Tópico recuperado com sucesso')
    );
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const updateTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!existingTopic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    // Check if new name conflicts with existing topic
    if (name && name !== existingTopic.name) {
      const conflictingTopic = await prisma.topic.findUnique({
        where: { name },
      });

      if (conflictingTopic) {
        return res.status(409).json(
          createErrorResponse('Tópico com este nome já existe')
        );
      }
    }

    // Update topic
    const topic = await prisma.topic.update({
      where: { id },
      data: { name, description },
      include: {
        subtopics: true,
        _count: {
          select: {
            subtopics: true,
            contestTopics: true,
          },
        },
      },
    });

    res.json(
      createSuccessResponse(topic, 'Tópico atualizado com sucesso')
    );
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const deleteTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subtopics: true,
            contestTopics: true,
          },
        },
      },
    });

    if (!existingTopic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    // Check if topic is being used in contests
    if (existingTopic._count.contestTopics > 0) {
      return res.status(400).json(
        createErrorResponse('Não é possível deletar tópico que está sendo usado em concursos')
      );
    }

    // Delete topic (cascade will handle subtopics and cards)
    await prisma.topic.delete({
      where: { id },
    });

    res.json(
      createSuccessResponse(null, 'Tópico deletado com sucesso')
    );
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getTopicStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        subtopics: {
          include: {
            cards: {
              include: {
                userCards: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!topic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    // Calculate statistics
    let totalCards = 0;
    let studiedCards = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    const subtopicStats = topic.subtopics.map(subtopic => {
      const subtopicTotalCards = subtopic.cards.length;
      const subtopicStudiedCards = subtopic.cards.filter(card => 
        card.userCards.some(uc => uc.totalCorrectReviews > 0 || uc.totalIncorrectReviews > 0)
      ).length;
      const subtopicCorrect = subtopic.cards.reduce((sum, card) => 
        sum + card.userCards.reduce((cardSum, uc) => cardSum + uc.totalCorrectReviews, 0), 0
      );
      const subtopicIncorrect = subtopic.cards.reduce((sum, card) => 
        sum + card.userCards.reduce((cardSum, uc) => cardSum + uc.totalIncorrectReviews, 0), 0
      );

      totalCards += subtopicTotalCards;
      studiedCards += subtopicStudiedCards;
      correctAnswers += subtopicCorrect;
      incorrectAnswers += subtopicIncorrect;

      return {
        subtopicId: subtopic.id,
        subtopicName: subtopic.name,
        totalCards: subtopicTotalCards,
        studiedCards: subtopicStudiedCards,
        correctAnswers: subtopicCorrect,
        incorrectAnswers: subtopicIncorrect,
        accuracy: subtopicCorrect + subtopicIncorrect > 0 
          ? (subtopicCorrect / (subtopicCorrect + subtopicIncorrect)) * 100 
          : 0,
      };
    });

    const stats = {
      topicId: topic.id,
      topicName: topic.name,
      totalCards,
      studiedCards,
      correctAnswers,
      incorrectAnswers,
      accuracy: correctAnswers + incorrectAnswers > 0 
        ? (correctAnswers / (correctAnswers + incorrectAnswers)) * 100 
        : 0,
      subtopicStats,
    };

    res.json(
      createSuccessResponse(stats, 'Estatísticas do tópico recuperadas com sucesso')
    );
  } catch (error) {
    console.error('Get topic stats error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

