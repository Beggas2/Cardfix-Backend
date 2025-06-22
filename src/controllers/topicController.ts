import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export const getTopics = async (req: Request, res: Response) => {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        subtopics: true,
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

export const getTopic = async (req: Request, res: Response) => {
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

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, priority } = req.body; // Adicionado priority

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
      return res.status(400).json(
        createErrorResponse('Tópico já existe com este nome')
      );
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        name,
        description,
        priority, // Adicionado priority
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

export const updateTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, priority } = req.body; // Adicionado priority

    // Check if topic exists
    const existingTopic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!existingTopic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    // Update topic
    const topic = await prisma.topic.update({
      where: { id },
      data: {
        name,
        description,
        priority, // Adicionado priority
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
    });

    if (!existingTopic) {
      return res.status(404).json(
        createErrorResponse('Tópico não encontrado')
      );
    }

    // Delete topic (cascade will handle related records)
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

export const getSubtopics = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.query;

    const whereClause: any = {};
    if (topicId) {
      whereClause.topicId = topicId as string;
    }

    const subtopics = await prisma.subtopic.findMany({
      where: whereClause,
      include: {
        topic: true,
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: { name: 'asc' },
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

export const getSubtopic = async (req: Request, res: Response) => {
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

export const createSubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, name, description, priority, estimatedCards } = req.body; // Adicionado priority e estimatedCards

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

    // Create subtopic
    const subtopic = await prisma.subtopic.create({
      data: {
        topicId,
        name,
        description,
        priority, // Adicionado priority
        estimatedCards, // Adicionado estimatedCards
      },
      include: {
        topic: true,
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

export const updateSubtopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, priority, estimatedCards } = req.body; // Adicionado priority e estimatedCards

    // Check if subtopic exists
    const existingSubtopic = await prisma.subtopic.findUnique({
      where: { id },
    });

    if (!existingSubtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Update subtopic
    const subtopic = await prisma.subtopic.update({
      where: { id },
      data: {
        name,
        description,
        priority, // Adicionado priority
        estimatedCards, // Adicionado estimatedCards
      },
      include: {
        topic: true,
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
    });

    if (!existingSubtopic) {
      return res.status(404).json(
        createErrorResponse('Subtópico não encontrado')
      );
    }

    // Delete subtopic (cascade will handle related records)
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

