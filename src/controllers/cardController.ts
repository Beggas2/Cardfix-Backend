import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { CreateCardRequest, GenerateCardsRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { advancedAIService } from '../services/advancedAIService';

export const createCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subtopicId, front, back }: CreateCardRequest = req.body;

    // Validate input
    if (!subtopicId || !front || !back) {
      return res.status(400).json(
        createErrorResponse('Subtópico, frente e verso do card são obrigatórios')
      );
    }

    // Check if subtopic exists
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: subtopicId },
    });

    if (!subtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Create card
    const card = await prisma.card.create({
      data: {
        subtopicId,
        front,
        back,
        createdBy: userId,
      },
      include: {
        subtopic: {
          include: {
            topic: true,
          },
        },
      },
    });

    res.status(201).json(
      createSuccessResponse(card, 'Card criado com sucesso')
    );
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor', (error as Error).message)
    );
  }
};

export const getCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subtopicId } = req.query;

    const whereClause: any = {};
    if (subtopicId) {
      whereClause.subtopicId = subtopicId as string;
    }

    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        subtopic: {
          include: {
            topic: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      createSuccessResponse(cards, 'Cards recuperados com sucesso')
    );
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor', (error as Error).message)
    );
  }
};

export const getCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        subtopic: {
          include: {
            topic: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      return res.status(404).json(
        createErrorResponse('Card não encontrado')
      );
    }

    res.json(
      createSuccessResponse(card, 'Card recuperado com sucesso')
    );
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor', (error as Error).message)
    );
  }
};

export const updateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { front, back } = req.body;

    // Check if card exists and belongs to user
    const existingCard = await prisma.card.findFirst({
      where: { id, createdBy: userId },
    });

    if (!existingCard) {
      return res.status(404).json(
        createErrorResponse('Card não encontrado ou você não tem permissão para editá-lo')
      );
    }

    // Update card
    const card = await prisma.card.update({
      where: { id },
      data: { front, back },
      include: {
        subtopic: {
          include: {
            topic: true,
          },
        },
      },
    });

    res.json(
      createSuccessResponse(card, 'Card atualizado com sucesso')
    );
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor', (error as Error).message)
    );
  }
};

export const deleteCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if card exists and belongs to user
    const existingCard = await prisma.card.findFirst({
      where: { id, createdBy: userId },
    });

    if (!existingCard) {
      return res.status(404).json(
        createErrorResponse('Card não encontrado ou você não tem permissão para deletá-lo')
      );
    }

    // Delete card
    await prisma.card.delete({
      where: { id },
    });

    res.json(
      createSuccessResponse(null, 'Card deletado com sucesso')
    );
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor', (error as Error).message)
    );
  }
};

export const generateCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subtopicId, contestId, count = 5 }: GenerateCardsRequest = req.body;

    // Validate input
    if (!subtopicId || !contestId) {
      return res.status(400).json(
        createErrorResponse('Subtópico e concurso são obrigatórios')
      );
    }

    // Check subscription limits for free users
    if (req.user!.subscriptionTier === 'free') {
      // Check if user has already generated cards for this subtopic
      const existingCards = await prisma.card.findMany({
        where: {
          subtopicId,
          createdBy: userId,
        },
      });

      if (existingCards.length > 0) {
        return res.status(403).json(
          createErrorResponse('Usuários gratuitos podem gerar cards apenas uma vez por subtópico. Considere fazer upgrade para premium.')
        );
      }
    }

    // Get subtopic and related data
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: {
        topic: true,
      },
    });

    if (!subtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Get contest data
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    // Extract institution and contest type from contest name
    const contestType = contest.selectedOffice || '';
    const institution = contest.name.split(' ')[0] || '';

    // Generate cards using advanced AI service
    const result = await advancedAIService.generateIntelligentCards({
      subtopicId,
      userId,
      userTier: req.user!.subscriptionTier,
      subtopicName: subtopic.name,
      topicName: subtopic.topic.name,
      contestName: contest.name,
      selectedOffice: contest.selectedOffice,
      examDate: contest.examDate,
      contestType,
      institution,
      count,
    });

    if (result.isReused) {
      return res.json(
        createSuccessResponse(
          { cards: result.cards, count: result.cards.length, isReused: true },
          result.message
        )
      );
    }

    // Save generated cards to database
    const savedCards = [];
    for (const generatedCard of result.cards) {
      if (!generatedCard.isReused) {
        const card = await prisma.card.create({
          data: {
            subtopicId,
            front: generatedCard.front,
            back: generatedCard.back,
            createdBy: userId,
          },
          include: {
            subtopic: {
              include: {
                topic: true,
              },
            },
          },
        });
        savedCards.push(card);
      }
    }

    res.status(201).json(
      createSuccessResponse(
        { 
          cards: savedCards, 
          count: savedCards.length,
          isReused: false,
          priorityData: result.priorityData
        },
        result.message
      )
    );
  } catch (error) {
    console.error('Generate cards error:', error);
    
    // Handle specific AI service errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(500).json(
          createErrorResponse('Erro de configuração do serviço de IA', (error as Error).message)
        );
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return res.status(429).json(
          createErrorResponse('Limite de uso da IA atingido. Tente novamente mais tarde.', (error as Error).message)
        );
      }
    }

    res.status(500).json(
      createErrorResponse('Erro ao gerar cards com IA', (error as Error).message)
    );
  }
};

export const bulkDeleteCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { cardIds } = req.body;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json(
        createErrorResponse('Lista de IDs de cards é obrigatória')
      );
    }

    // Delete cards that belong to the user
    const result = await prisma.card.deleteMany({
      where: {
        id: { in: cardIds },
        createdBy: userId,
      },
    });

    res.json(
      createSuccessResponse(
        { deletedCount: result.count },
        `${result.count} cards deletados com sucesso`
      )
    );
  } catch (error) {
    console.error('Bulk delete cards error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor', (error as Error).message)
    );
  }
};

