"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTopicFromContest = exports.addTopicToContest = exports.deleteContest = exports.updateContest = exports.getContest = exports.getContests = exports.createContest = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const createContest = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { name, description, targetDate, examDate, selectedOffice } = req.body;
        // Validate input
        if (!name) {
            return res.status(400).json((0, response_1.createErrorResponse)('Nome do concurso é obrigatório'));
        }
        // Create contest
        const contest = await prisma_1.prisma.contest.create({
            data: {
                userId,
                name,
                description,
                targetDate: targetDate ? new Date(targetDate) : undefined,
                examDate: examDate, // Removido new Date() pois já é string
                selectedOffice,
            },
        });
        res.status(201).json((0, response_1.createSuccessResponse)(contest, 'Concurso criado com sucesso'));
    }
    catch (error) {
        console.error('Create contest error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.createContest = createContest;
const getContests = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const contests = await prisma_1.prisma.contest.findMany({
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
        res.json((0, response_1.createSuccessResponse)(contests, 'Concursos recuperados com sucesso'));
    }
    catch (error) {
        console.error('Get contests error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getContests = getContests;
const getContest = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { id } = req.params;
        const contest = await prisma_1.prisma.contest.findFirst({
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
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        res.json((0, response_1.createSuccessResponse)(contest, 'Concurso recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get contest error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getContest = getContest;
const updateContest = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { id } = req.params;
        const { name, description, targetDate, examDate, selectedOffice } = req.body;
        // Check if contest exists and belongs to user
        const existingContest = await prisma_1.prisma.contest.findFirst({
            where: { id, userId },
        });
        if (!existingContest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Update contest
        const contest = await prisma_1.prisma.contest.update({
            where: { id },
            data: {
                name,
                description,
                targetDate: targetDate ? new Date(targetDate) : undefined,
                examDate: examDate, // Removido new Date() pois já é string
                selectedOffice,
            },
        });
        res.json((0, response_1.createSuccessResponse)(contest, 'Concurso atualizado com sucesso'));
    }
    catch (error) {
        console.error('Update contest error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.updateContest = updateContest;
const deleteContest = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { id } = req.params;
        // Check if contest exists and belongs to user
        const existingContest = await prisma_1.prisma.contest.findFirst({
            where: { id, userId },
        });
        if (!existingContest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Delete contest (cascade will handle related records)
        await prisma_1.prisma.contest.delete({
            where: { id },
        });
        res.json((0, response_1.createSuccessResponse)(null, 'Concurso deletado com sucesso'));
    }
    catch (error) {
        console.error('Delete contest error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.deleteContest = deleteContest;
const addTopicToContest = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.params;
        const { topicId } = req.body;
        // Validate input
        if (!topicId) {
            return res.status(400).json((0, response_1.createErrorResponse)('ID do tópico é obrigatório'));
        }
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Check if topic exists
        const topic = await prisma_1.prisma.topic.findUnique({
            where: { id: topicId },
        });
        if (!topic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Tópico não encontrado'));
        }
        // Add topic to contest (if not already added)
        const contestTopic = await prisma_1.prisma.contestTopic.upsert({
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
        res.status(201).json((0, response_1.createSuccessResponse)(contestTopic, 'Tópico adicionado ao concurso com sucesso'));
    }
    catch (error) {
        console.error('Add topic to contest error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.addTopicToContest = addTopicToContest;
const removeTopicFromContest = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId, topicId } = req.params;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Remove topic from contest
        await prisma_1.prisma.contestTopic.deleteMany({
            where: {
                contestId,
                topicId,
                userId,
            },
        });
        res.json((0, response_1.createSuccessResponse)(null, 'Tópico removido do concurso com sucesso'));
    }
    catch (error) {
        console.error('Remove topic from contest error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.removeTopicFromContest = removeTopicFromContest;
//# sourceMappingURL=contestController.js.map