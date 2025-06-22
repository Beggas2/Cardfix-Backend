import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const createSubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, name, description } = req.body;

    // Validate input
    if (!topicId || !name) {
      return res.status(400).json(
        createErrorResponse('ID do tópico e nome do subtópico são obrigatórios')
      );
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    // Check if subtopic already exists for this topic
    const existingSubtopic = await prisma.subtopic.findUnique({
      where: {
        topicId_name: {
          topicId,
          name,
        },
      },
    });

    if (existingSubtopic) {
      return res.status(409).json(
        createErrorResponse('Subtópico com este nome já existe neste tópico')
      );
    }

    // Create subtopic
    const subtopic = await prisma.subtopic.create({
      data: {
        topicId,
        name,
        description,
      },
      include: {
        topic: true,
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    res.status(201).json(
      createSuccessResponse(subtopic, 'Subtópico criado com sucesso')
    );
  } catch (error) {
    console.error('Create subtopic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getSubtopics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, contestId } = req.query;

    let whereClause: any = {};
    
    if (topicId) {
      whereClause.topicId = topicId as string;
    }

    if (contestId) {
      whereClause.topic = {
        contestTopics: {
          some: {
            contestId: contestId as string,
          },
        },
      };
    }

    const subtopics = await prisma.subtopic.findMany({
      where: whereClause,
      include: {
        topic: true,
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
      orderBy: [
        { topic: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    res.json(
      createSuccessResponse(subtopics, 'Subtópicos recuperados com sucesso')
    );
  } catch (error) {
    console.error('Get subtopics error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getSubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subtopic = await prisma.subtopic.findUnique({
      where: { id },
      include: {
        topic: true,
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
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!subtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    res.json(
      createSuccessResponse(subtopic, 'Subtópico recuperado com sucesso')
    );
  } catch (error) {
    console.error('Get subtopic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const updateSubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if subtopic exists
    const existingSubtopic = await prisma.subtopic.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!existingSubtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Check if new name conflicts with existing subtopic in the same topic
    if (name && name !== existingSubtopic.name) {
      const conflictingSubtopic = await prisma.subtopic.findUnique({
        where: {
          topicId_name: {
            topicId: existingSubtopic.topicId,
            name,
          },
        },
      });

      if (conflictingSubtopic) {
        return res.status(409).json(
          createErrorResponse('Subtópico com este nome já existe neste tópico')
        );
      }
    }

    // Update subtopic
    const subtopic = await prisma.subtopic.update({
      where: { id },
      data: { name, description },
      include: {
        topic: true,
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    res.json(
      createSuccessResponse(subtopic, 'Subtópico atualizado com sucesso')
    );
  } catch (error) {
    console.error('Update subtopic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const deleteSubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if subtopic exists
    const existingSubtopic = await prisma.subtopic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    if (!existingSubtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Check if subtopic has cards
    if (existingSubtopic._count.cards > 0) {
      return res.status(400).json(
        createErrorResponse('Não é possível deletar subtópico que possui cards')
      );
    }

    // Delete subtopic
    await prisma.subtopic.delete({
      where: { id },
    });

    res.json(
      createSuccessResponse(null, 'Subtópico deletado com sucesso')
    );
  } catch (error) {
    console.error('Delete subtopic error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getSubtopicStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const subtopic = await prisma.subtopic.findUnique({
      where: { id },
      include: {
        topic: true,
        cards: {
          include: {
            userCards: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!subtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Calculate statistics
    const totalCards = subtopic.cards.length;
    const studiedCards = subtopic.cards.filter(card => 
      card.userCards.some(uc => uc.totalCorrectReviews > 0 || uc.totalIncorrectReviews > 0)
    ).length;
    const correctAnswers = subtopic.cards.reduce((sum, card) => 
      sum + card.userCards.reduce((cardSum, uc) => cardSum + uc.totalCorrectReviews, 0), 0
    );
    const incorrectAnswers = subtopic.cards.reduce((sum, card) => 
      sum + card.userCards.reduce((cardSum, uc) => cardSum + uc.totalIncorrectReviews, 0), 0
    );

    const cardStats = subtopic.cards.map(card => {
      const userCard = card.userCards[0]; // Should be only one per user
      return {
        cardId: card.id,
        front: card.front,
        difficulty: card.difficulty,
        correctAnswers: userCard?.totalCorrectReviews || 0,
        incorrectAnswers: userCard?.totalIncorrectReviews || 0,
        accuracy: userCard && (userCard.totalCorrectReviews + userCard.totalIncorrectReviews) > 0
          ? (userCard.totalCorrectReviews / (userCard.totalCorrectReviews + userCard.totalIncorrectReviews)) * 100
          : 0,
        status: userCard?.status || 'new',
        lastReviewed: userCard?.lastReviewed,
        nextReview: userCard?.nextReview,
      };
    });

    const stats = {
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      topicId: subtopic.topic.id,
      topicName: subtopic.topic.name,
      totalCards,
      studiedCards,
      correctAnswers,
      incorrectAnswers,
      accuracy: correctAnswers + incorrectAnswers > 0 
        ? (correctAnswers / (correctAnswers + incorrectAnswers)) * 100 
        : 0,
      cardStats,
    };

    res.json(
      createSuccessResponse(stats, 'Estatísticas do subtópico recuperadas com sucesso')
    );
  } catch (error) {
    console.error('Get subtopic stats error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

