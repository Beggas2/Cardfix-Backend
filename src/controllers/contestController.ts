import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { CreateContestRequest } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export const createContest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, description, targetDate, examDate, selectedOffice }: CreateContestRequest = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json(
        createErrorResponse('Nome do concurso é obrigatório')
      );
    }

    // Create contest
    const contest = await prisma.contest.create({
      data: {
        userId,
        name,
        description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        examDate: examDate ? new Date(examDate) : undefined, // Corrigido para aceitar undefined
        selectedOffice,
      },
    });

    res.status(201).json(
      createSuccessResponse(contest, 'Concurso criado com sucesso')
    );
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getContests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const contests = await prisma.contest.findMany({
      where: { userId },
      include: {
        contestTopics: {
          include: {
            topic: {
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
            },
          },
        },
        userCards: {
          where: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      createSuccessResponse(contests, 'Concursos recuperados com sucesso')
    );
  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const getContest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const contest = await prisma.contest.findFirst({
      where: { id, userId },
      include: {
        contestTopics: {
          include: {
            topic: {
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
            },
          },
        },
        userCards: {
          where: { userId },
        },
      },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    res.json(
      createSuccessResponse(contest, 'Concurso recuperado com sucesso')
    );
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const updateContest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, description, targetDate, examDate, selectedOffice } = req.body;

    // Check if contest exists and belongs to user
    const existingContest = await prisma.contest.findFirst({
      where: { id, userId },
    });

    if (!existingContest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    // Update contest
    const contest = await prisma.contest.update({
      where: { id },
      data: {
        name,
        description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        examDate: examDate ? new Date(examDate) : undefined, // Corrigido para aceitar undefined
        selectedOffice,
      },
    });

    res.json(
      createSuccessResponse(contest, 'Concurso atualizado com sucesso')
    );
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const deleteContest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if contest exists and belongs to user
    const existingContest = await prisma.contest.findFirst({
      where: { id, userId },
    });

    if (!existingContest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    // Delete contest (cascade will handle related records)
    await prisma.contest.delete({
      where: { id },
    });

    res.json(
      createSuccessResponse(null, 'Concurso deletado com sucesso')
    );
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const addTopicToContest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.params;
    const { topicId } = req.body;

    // Validate input
    if (!topicId) {
      return res.status(400).json(
        createErrorResponse('ID do tópico é obrigatório')
      );
    }

    // Check if contest exists and belongs to user
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
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

    // Add topic to contest (if not already added)
    const contestTopic = await prisma.contestTopic.upsert({
      where: {
        contestId_topicId: {
          contestId,
          topicId,
        },
      },
      update: {},
      create: {
        contestId,
        topicId,
        userId,
      },
      include: {
        topic: true,
      },
    });

    res.status(201).json(
      createSuccessResponse(contestTopic, 'Tópico adicionado ao concurso com sucesso')
    );
  } catch (error) {
    console.error('Add topic to contest error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const removeTopicFromContest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId, topicId } = req.params;

    // Check if contest exists and belongs to user
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    // Remove topic from contest
    await prisma.contestTopic.deleteMany({
      where: {
        contestId,
        topicId,
        userId,
      },
    });

    res.json(
      createSuccessResponse(null, 'Tópico removido do concurso com sucesso')
    );
  } catch (error) {
    console.error('Remove topic from contest error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

