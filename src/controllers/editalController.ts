import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

export const uploadEdital = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json(
        createErrorResponse('Arquivo PDF é obrigatório')
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

    // Update contest with file information
    const updatedContest = await prisma.contest.update({
      where: { id: contestId },
      data: {
        editalFileId: file.filename, // Store filename as reference
        isProcessing: false,
        processingError: null,
      },
    });

    const fileInfo = {
      fileId: file.filename,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
    };

    res.status(201).json(
      createSuccessResponse(
        { contest: updatedContest, file: fileInfo },
        'Edital enviado com sucesso'
      )
    );
  } catch (error) {
    console.error('Upload edital error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const processEdital = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.params;

    // Check if contest exists and belongs to user
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    if (!contest.editalFileId) {
      return res.status(400).json(
        createErrorResponse('Nenhum edital foi enviado para este concurso')
      );
    }

    // Mark as processing
    await prisma.contest.update({
      where: { id: contestId },
      data: {
        isProcessing: true,
        processingError: null,
      },
    });

    // Simulate edital processing (in a real implementation, this would parse the PDF)
    // For now, we'll create some sample topics and subtopics
    const sampleTopics = [
      {
        name: 'Direito Constitucional',
        subtopics: [
          'Princípios Fundamentais',
          'Direitos e Garantias Fundamentais',
          'Organização do Estado',
          'Organização dos Poderes',
        ],
      },
      {
        name: 'Direito Administrativo',
        subtopics: [
          'Princípios da Administração Pública',
          'Atos Administrativos',
          'Processo Administrativo',
          'Licitações e Contratos',
        ],
      },
      {
        name: 'Português',
        subtopics: [
          'Interpretação de Textos',
          'Gramática',
          'Ortografia',
          'Redação Oficial',
        ],
      },
    ];

    const parsedData = {
      topics: sampleTopics,
      processedAt: new Date().toISOString(),
      totalTopics: sampleTopics.length,
      totalSubtopics: sampleTopics.reduce((acc, topic) => acc + topic.subtopics.length, 0),
    };

    // Create topics and subtopics
    for (const topicData of sampleTopics) {
      // Create or get topic
      const topic = await prisma.topic.upsert({
        where: { name: topicData.name },
        update: {},
        create: {
          name: topicData.name,
          description: `Tópico de ${topicData.name}`,
        },
      });

      // Add topic to contest
      await prisma.contestTopic.upsert({
        where: {
          contestId_topicId: {
            contestId,
            topicId: topic.id,
          },
        },
        update: {},
        create: {
          contestId,
          topicId: topic.id,
          userId,
        },
      });

      // Create subtopics
      for (const subtopicName of topicData.subtopics) {
        await prisma.subtopic.upsert({
          where: {
            topicId_name: {
              topicId: topic.id,
              name: subtopicName,
            },
          },
          update: {},
          create: {
            topicId: topic.id,
            name: subtopicName,
            description: `Subtópico de ${subtopicName}`,
          },
        });
      }
    }

    // Update contest with processed data
    const updatedContest = await prisma.contest.update({
      where: { id: contestId },
      data: {
        parsedEditalData: JSON.stringify(parsedData),
        isProcessing: false,
        processingError: null,
      },
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

    res.json(
      createSuccessResponse(updatedContest, 'Edital processado com sucesso')
    );
  } catch (error) {
    console.error('Process edital error:', error);
    
    // Update contest with error
    await prisma.contest.update({
      where: { id: req.params.contestId },
      data: {
        isProcessing: false,
        processingError: 'Erro ao processar edital',
      },
    });

    res.status(500).json(
      createErrorResponse('Erro ao processar edital')
    );
  }
};

export const getEditalFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.params;

    // Check if contest exists and belongs to user
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    if (!contest.editalFileId) {
      return res.status(404).json(
        createErrorResponse('Nenhum edital encontrado para este concurso')
      );
    }

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(uploadDir, contest.editalFileId);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(
        createErrorResponse('Arquivo do edital não encontrado')
      );
    }

    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Get edital file error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

export const deleteEdital = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { contestId } = req.params;

    // Check if contest exists and belongs to user
    const contest = await prisma.contest.findFirst({
      where: { id: contestId, userId },
    });

    if (!contest) {
      return res.status(404).json(
        createErrorResponse('Concurso não encontrado')
      );
    }

    if (!contest.editalFileId) {
      return res.status(404).json(
        createErrorResponse('Nenhum edital encontrado para este concurso')
      );
    }

    // Delete file from filesystem
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(uploadDir, contest.editalFileId);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update contest
    const updatedContest = await prisma.contest.update({
      where: { id: contestId },
      data: {
        editalFileId: null,
        parsedEditalData: null,
        processingError: null,
        isProcessing: false,
      },
    });

    res.json(
      createSuccessResponse(updatedContest, 'Edital removido com sucesso')
    );
  } catch (error) {
    console.error('Delete edital error:', error);
    res.status(500).json(
      createErrorResponse('Erro interno do servidor')
    );
  }
};

