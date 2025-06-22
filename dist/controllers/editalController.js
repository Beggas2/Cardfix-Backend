"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcessingStatus = exports.deleteEdital = exports.getEditalFile = exports.processEdital = exports.uploadEdital = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const pdfProcessingService_1 = require("../services/pdfProcessingService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadEdital = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.params;
        const file = req.file;
        if (!file) {
            return res.status(400).json((0, response_1.createErrorResponse)('Arquivo PDF é obrigatório'));
        }
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Update contest with file information
        const updatedContest = await prisma_1.prisma.contest.update({
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
        res.status(201).json((0, response_1.createSuccessResponse)({ contest: updatedContest, file: fileInfo }, 'Edital enviado com sucesso'));
    }
    catch (error) {
        console.error('Upload edital error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.uploadEdital = uploadEdital;
const processEdital = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.params;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        if (!contest.editalFileId) {
            return res.status(400).json((0, response_1.createErrorResponse)('Nenhum edital foi enviado para este concurso'));
        }
        // Mark as processing
        await prisma_1.prisma.contest.update({
            where: { id: contestId },
            data: {
                isProcessing: true,
                processingError: null,
            },
        });
        try {
            // Get file path
            const uploadDir = process.env.UPLOAD_DIR || 'uploads';
            const filePath = path_1.default.join(uploadDir, contest.editalFileId);
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error('Arquivo do edital não encontrado');
            }
            // Extract text from PDF
            const pdfData = await pdfProcessingService_1.PDFProcessingService.extractTextFromPDF(filePath);
            // Process with AI
            const processedData = await pdfProcessingService_1.PDFProcessingService.processEditalWithAI(pdfData.text, {
                institution: contest.institution || contest.name.split(' ')[0] || undefined, // Usar contest.institution se existir
                position: contest.selectedOffice || undefined,
                examDate: contest.examDate, // Já é string
            });
            // Create topics and subtopics in database
            for (const topicData of processedData.topics) {
                // Create or get topic
                const topic = await prisma_1.prisma.topic.upsert({
                    where: { name: topicData.name },
                    update: {
                        description: topicData.description,
                    },
                    create: {
                        name: topicData.name,
                        description: topicData.description,
                    },
                });
                // Add topic to contest
                await prisma_1.prisma.contestTopic.upsert({
                    where: {
                        contestId_topicId: {
                            contestId,
                            topicId: topic.id,
                        },
                    },
                    update: {
                        priority: topicData.priority, // Adicionado 'priority'
                    },
                    create: {
                        contestId,
                        topicId: topic.id,
                        userId,
                        priority: topicData.priority, // Adicionado 'priority'
                    },
                });
                // Create subtopics
                for (const subtopicData of topicData.subtopics) {
                    await prisma_1.prisma.subtopic.upsert({
                        where: {
                            topicId_name: {
                                topicId: topic.id,
                                name: subtopicData.name,
                            },
                        },
                        update: {
                            description: subtopicData.description,
                            priority: subtopicData.priority,
                            estimatedCards: subtopicData.estimatedCards,
                        },
                        create: {
                            topicId: topic.id,
                            name: subtopicData.name,
                            description: subtopicData.description,
                            priority: subtopicData.priority,
                            estimatedCards: subtopicData.estimatedCards,
                        },
                    });
                }
            }
            // Update contest with processed data
            const updatedContest = await prisma_1.prisma.contest.update({
                where: { id: contestId },
                data: {
                    parsedEditalData: JSON.stringify(processedData),
                    isProcessing: false,
                    processingError: null,
                    // Update contest info if extracted from PDF
                    institution: processedData.contestInfo?.institution || contest.institution || contest.name.split(' ')[0],
                    position: processedData.contestInfo?.position || contest.selectedOffice,
                    examDate: processedData.contestInfo?.examDate || contest.examDate, // Já é string
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
            res.json((0, response_1.createSuccessResponse)({
                contest: updatedContest,
                processedData,
                extractedText: pdfData.text.substring(0, 500) + '...', // Preview
            }, 'Edital processado com sucesso pela IA'));
        }
        catch (processingError) {
            console.error('Processing error:', processingError);
            // Update contest with error
            await prisma_1.prisma.contest.update({
                where: { id: contestId },
                data: {
                    isProcessing: false,
                    processingError: processingError instanceof Error
                        ? processingError.message
                        : 'Erro desconhecido ao processar edital',
                },
            });
            res.status(500).json((0, response_1.createErrorResponse)(processingError instanceof Error
                ? processingError.message
                : 'Erro ao processar edital', processingError.message));
        }
    }
    catch (error) {
        console.error('Process edital error:', error);
        // Update contest with error
        await prisma_1.prisma.contest.update({
            where: { id: req.params.contestId },
            data: {
                isProcessing: false,
                processingError: 'Erro interno do servidor',
            },
        });
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.processEdital = processEdital;
const getEditalFile = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.params;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        if (!contest.editalFileId) {
            return res.status(404).json((0, response_1.createErrorResponse)('Nenhum edital encontrado para este concurso'));
        }
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const filePath = path_1.default.join(uploadDir, contest.editalFileId);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json((0, response_1.createErrorResponse)('Arquivo do edital não encontrado'));
        }
        // Send file
        res.sendFile(path_1.default.resolve(filePath));
    }
    catch (error) {
        console.error('Get edital file error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getEditalFile = getEditalFile;
const deleteEdital = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.params;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        if (!contest.editalFileId) {
            return res.status(404).json((0, response_1.createErrorResponse)('Nenhum edital encontrado para este concurso'));
        }
        // Delete file from filesystem
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const filePath = path_1.default.join(uploadDir, contest.editalFileId);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Update contest
        const updatedContest = await prisma_1.prisma.contest.update({
            where: { id: contestId },
            data: {
                editalFileId: null,
                parsedEditalData: null,
                processingError: null,
                isProcessing: false,
            },
        });
        res.json((0, response_1.createSuccessResponse)(updatedContest, 'Edital removido com sucesso'));
    }
    catch (error) {
        console.error('Delete edital error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.deleteEdital = deleteEdital;
const getProcessingStatus = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.params;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
            select: {
                id: true,
                isProcessing: true,
                processingError: true,
                editalFileId: true,
                parsedEditalData: true,
            },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        const status = {
            hasEdital: !!contest.editalFileId,
            isProcessing: contest.isProcessing,
            processingError: contest.processingError,
            isProcessed: !!contest.parsedEditalData,
            processedData: contest.parsedEditalData
                ? JSON.parse(contest.parsedEditalData)
                : null,
        };
        res.json((0, response_1.createSuccessResponse)(status, 'Status obtido com sucesso'));
    }
    catch (error) {
        console.error('Get processing status error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getProcessingStatus = getProcessingStatus;
//# sourceMappingURL=editalController.js.map