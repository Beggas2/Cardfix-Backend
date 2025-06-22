"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcessingStatus = exports.deleteEdital = exports.getEditalFile = exports.processEdital = exports.uploadEdital = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const pdfService_1 = require("../services/pdfService");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadEdital = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        res.status(201).json((0, response_1.createSuccessResponse)({ contest: updatedContest, file: fileInfo }, 'Edital enviado com sucesso. Use o endpoint /process para processar o arquivo.'));
    }
    catch (error) {
        console.error('Upload edital error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.uploadEdital = uploadEdital;
const processEdital = async (req, res) => {
    try {
        const userId = req.user.userId;
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
            // Process edital with AI
            const parsedData = await (0, pdfService_1.processEditalWithAI)(contestId, filePath, contest.name, contest.selectedOffice || '', contest.examDate ? new Date(contest.examDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Default: 90 days from now
            );
            // Update contest topic relations with userId
            await prisma_1.prisma.contestTopic.updateMany({
                where: {
                    contestId,
                    userId: '', // Update empty userId fields
                },
                data: { userId },
            });
            // Update contest with processed data
            const updatedContest = await prisma_1.prisma.contest.update({
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
                                    subtopics: {
                                        include: {
                                            cards: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            res.json((0, response_1.createSuccessResponse)(updatedContest, 'Edital processado com sucesso! Tópicos, subtópicos e cards foram gerados automaticamente.'));
        }
        catch (processingError) {
            console.error('Processing error:', processingError);
            // Update contest with error
            await prisma_1.prisma.contest.update({
                where: { id: contestId },
                data: {
                    isProcessing: false,
                    processingError: processingError instanceof Error ? processingError.message : 'Erro desconhecido',
                },
            });
            res.status(500).json((0, response_1.createErrorResponse)(`Erro ao processar edital: ${processingError instanceof Error ? processingError.message : 'Erro desconhecido'}`));
        }
    }
    catch (error) {
        console.error('Process edital error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.processEdital = processEdital;
const getEditalFile = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getEditalFile = getEditalFile;
const deleteEdital = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.deleteEdital = deleteEdital;
const getProcessingStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { contestId } = req.params;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
            select: {
                id: true,
                name: true,
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
            contestId: contest.id,
            contestName: contest.name,
            hasEdital: !!contest.editalFileId,
            isProcessing: contest.isProcessing,
            processingError: contest.processingError,
            isProcessed: !!contest.parsedEditalData,
            parsedData: contest.parsedEditalData ? JSON.parse(contest.parsedEditalData) : null,
        };
        res.json((0, response_1.createSuccessResponse)(status, 'Status do processamento recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get processing status error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getProcessingStatus = getProcessingStatus;
//# sourceMappingURL=editalController.js.map