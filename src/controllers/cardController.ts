import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { CreateCardRequest, GenerateCardsRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateCardsWithRetry } from '../services/aiService';

export const createCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { subtopicId, front, back, difficulty = 'medium' }: CreateCardRequest = req.body;

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
        difficulty,
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
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subtopicId, topicId, contestId } = req.query;

    const whereClause: any = {};
    
    if (subtopicId) {
      whereClause.subtopicId = subtopicId as string;
    } else if (topicId) {
      whereClause.subtopic = {
        topicId: topicId as string,
      };
    } else if (contestId) {
      whereClause.subtopic = {
        topic: {
          contestTopics: {
            some: {
              contestId: contestId as string,
            },
          },
        },
      };
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
      createErrorResponse('Erro interno do servidor')
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
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const updateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { front, back, difficulty } = req.body;

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
      data: { front, back, difficulty },
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
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const deleteCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
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
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const generateCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
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

    // Generate cards using AI
    const generatedCards = await generateCardsWithRetry({
      subtopicName: subtopic.name,
      topicName: subtopic.topic.name,
      contestName: contest.name,
      selectedOffice: contest.selectedOffice,
      count,
    });

    // Save generated cards to database
    const savedCards = [];
    for (const generatedCard of generatedCards) {
      const card = await prisma.card.create({
        data: {
          subtopicId,
          front: generatedCard.front,
          back: generatedCard.back,
          difficulty: 'medium', // Default difficulty
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

    res.status(201).json(
      createSuccessResponse(
        { cards: savedCards, count: savedCards.length },
        `${savedCards.length} cards gerados com sucesso`
      )
    );
  } catch (error) {
    console.error('Generate cards error:', error);
    
    // Handle specific AI service errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(500).json(
          createErrorResponse('Erro de configuração do serviço de IA')
        );
      }
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return res.status(429).json(
          createErrorResponse('Limite de uso da IA atingido. Tente novamente mais tarde.')
        );
      }
    }

    res.status(500).json(
      createErrorResponse('Erro ao gerar cards com IA')
    );
  }
};

export const bulkGenerateCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId, topicIds = [], subtopicIds = [] } = req.body;

    // Validate input
    if (!contestId) {
      return res.status(400).json(
        createErrorResponse('ID do concurso é obrigatório')
      );
    }

    // Get contest data
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
      include: {
        contestTopics: {
          include: {
            topic: {
              include: {
                subtopics: true,
              },
            },
          },
        },
      },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    // Determine which subtopics to generate cards for
    let targetSubtopics: any[] = [];

    if (subtopicIds.length > 0) {
      // Generate for specific subtopics
      targetSubtopics = await prisma.subtopic.findMany({
        where: {
          id: { in: subtopicIds },
        },
        include: {
          topic: true,
        },
      });
    } else if (topicIds.length > 0) {
      // Generate for all subtopics of specific topics
      targetSubtopics = await prisma.subtopic.findMany({
        where: {
          topicId: { in: topicIds },
        },
        include: {
          topic: true,
        },
      });
    } else {
      // Generate for all subtopics in the contest
      targetSubtopics = contest.contestTopics.flatMap(ct => 
        ct.topic.subtopics.map(st => ({
          ...st,
          topic: ct.topic,
        }))
      );
    }

    if (targetSubtopics.length === 0) {
      return res.status(400).json(
        createErrorResponse('Nenhum subtópico encontrado para gerar cards')
      );
    }

    // Generate cards for each subtopic
    const results = [];
    let totalGenerated = 0;
    let errors = [];

    for (const subtopic of targetSubtopics) {
      try {
        // Check if cards already exist for this subtopic
        const existingCards = await prisma.card.findMany({
          where: { subtopicId: subtopic.id },
        });

        const cardsToGenerate = Math.max(0, 5 - existingCards.length); // Generate up to 5 cards per subtopic

        if (cardsToGenerate > 0) {
          const generatedCards = await generateCardsWithRetry({
            subtopicName: subtopic.name,
            topicName: subtopic.topic.name,
            contestName: contest.name,
            selectedOffice: contest.selectedOffice,
            count: cardsToGenerate,
          });

          // Save generated cards
          const savedCards = [];
          for (const generatedCard of generatedCards) {
            const card = await prisma.card.create({
              data: {
                subtopicId: subtopic.id,
                front: generatedCard.front,
                back: generatedCard.back,
                difficulty: 'medium',
                createdBy: userId,
              },
            });
            savedCards.push(card);
          }

          results.push({
            subtopicId: subtopic.id,
            subtopicName: subtopic.name,
            topicName: subtopic.topic.name,
            generated: savedCards.length,
            existing: existingCards.length,
          });

          totalGenerated += savedCards.length;
        } else {
          results.push({
            subtopicId: subtopic.id,
            subtopicName: subtopic.name,
            topicName: subtopic.topic.name,
            generated: 0,
            existing: existingCards.length,
            message: 'Subtópico já possui cards suficientes',
          });
        }
      } catch (error) {
        console.error(`Erro ao gerar cards para ${subtopic.name}:`, error);
        errors.push({
          subtopicId: subtopic.id,
          subtopicName: subtopic.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    res.status(201).json(
      createSuccessResponse(
        {
          totalGenerated,
          results,
          errors,
          summary: {
            subtopicsProcessed: targetSubtopics.length,
            successful: results.length,
            failed: errors.length,
          },
        },
        `Geração em lote concluída. ${totalGenerated} cards gerados no total.`
      )
    );
  } catch (error) {
    console.error('Bulk generate cards error:', error);
    res.status(500).json(
      createErrorResponse('Erro ao gerar cards em lote')
    );
  }
};

