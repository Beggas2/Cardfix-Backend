"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubtopic = exports.updateSubtopic = exports.createSubtopic = exports.getSubtopic = exports.getSubtopics = exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.getTopic = exports.getTopics = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const getTopics = async (req, res) => {
    try {
        const topics = await prisma_1.prisma.topic.findMany({
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
        res.json((0, response_1.createSuccessResponse)(topics, 'Tópicos recuperados com sucesso'));
    }
    catch (error) {
        console.error('Get topics error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getTopics = getTopics;
const getTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const topic = await prisma_1.prisma.topic.findUnique({
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
            return res.status(404).json((0, response_1.createErrorResponse)('Tópico não encontrado'));
        }
        res.json((0, response_1.createSuccessResponse)(topic, 'Tópico recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get topic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getTopic = getTopic;
const createTopic = async (req, res) => {
    try {
        const { name, description, priority } = req.body; // Adicionado priority
        // Validate input
        if (!name) {
            return res.status(400).json((0, response_1.createErrorResponse)('Nome do tópico é obrigatório'));
        }
        // Check if topic already exists
        const existingTopic = await prisma_1.prisma.topic.findUnique({
            where: { name },
        });
        if (existingTopic) {
            return res.status(400).json((0, response_1.createErrorResponse)('Tópico já existe com este nome'));
        }
        // Create topic
        const topic = await prisma_1.prisma.topic.create({
            data: {
                name,
                description,
                priority, // Adicionado priority
            },
        });
        res.status(201).json((0, response_1.createSuccessResponse)(topic, 'Tópico criado com sucesso'));
    }
    catch (error) {
        console.error('Create topic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.createTopic = createTopic;
const updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, priority } = req.body; // Adicionado priority
        // Check if topic exists
        const existingTopic = await prisma_1.prisma.topic.findUnique({
            where: { id },
        });
        if (!existingTopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Tópico não encontrado'));
        }
        // Update topic
        const topic = await prisma_1.prisma.topic.update({
            where: { id },
            data: {
                name,
                description,
                priority, // Adicionado priority
            },
        });
        res.json((0, response_1.createSuccessResponse)(topic, 'Tópico atualizado com sucesso'));
    }
    catch (error) {
        console.error('Update topic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.updateTopic = updateTopic;
const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if topic exists
        const existingTopic = await prisma_1.prisma.topic.findUnique({
            where: { id },
        });
        if (!existingTopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Tópico não encontrado'));
        }
        // Delete topic (cascade will handle related records)
        await prisma_1.prisma.topic.delete({
            where: { id },
        });
        res.json((0, response_1.createSuccessResponse)(null, 'Tópico deletado com sucesso'));
    }
    catch (error) {
        console.error('Delete topic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.deleteTopic = deleteTopic;
const getSubtopics = async (req, res) => {
    try {
        const { topicId } = req.query;
        const whereClause = {};
        if (topicId) {
            whereClause.topicId = topicId;
        }
        const subtopics = await prisma_1.prisma.subtopic.findMany({
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
        res.json((0, response_1.createSuccessResponse)(subtopics, 'Subtópicos recuperados com sucesso'));
    }
    catch (error) {
        console.error('Get subtopics error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getSubtopics = getSubtopics;
const getSubtopic = async (req, res) => {
    try {
        const { id } = req.params;
        const subtopic = await prisma_1.prisma.subtopic.findUnique({
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
            return res.status(404).json((0, response_1.createErrorResponse)('Subtópico não encontrado'));
        }
        res.json((0, response_1.createSuccessResponse)(subtopic, 'Subtópico recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get subtopic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getSubtopic = getSubtopic;
const createSubtopic = async (req, res) => {
    try {
        const { topicId, name, description, priority, estimatedCards } = req.body; // Adicionado priority e estimatedCards
        // Validate input
        if (!topicId || !name) {
            return res.status(400).json((0, response_1.createErrorResponse)('ID do tópico e nome do subtópico são obrigatórios'));
        }
        // Check if topic exists
        const topic = await prisma_1.prisma.topic.findUnique({
            where: { id: topicId },
        });
        if (!topic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Tópico não encontrado'));
        }
        // Create subtopic
        const subtopic = await prisma_1.prisma.subtopic.create({
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
        res.status(201).json((0, response_1.createSuccessResponse)(subtopic, 'Subtópico criado com sucesso'));
    }
    catch (error) {
        console.error('Create subtopic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.createSubtopic = createSubtopic;
const updateSubtopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, priority, estimatedCards } = req.body; // Adicionado priority e estimatedCards
        // Check if subtopic exists
        const existingSubtopic = await prisma_1.prisma.subtopic.findUnique({
            where: { id },
        });
        if (!existingSubtopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Subtópico não encontrado'));
        }
        // Update subtopic
        const subtopic = await prisma_1.prisma.subtopic.update({
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
        res.json((0, response_1.createSuccessResponse)(subtopic, 'Subtópico atualizado com sucesso'));
    }
    catch (error) {
        console.error('Update subtopic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.updateSubtopic = updateSubtopic;
const deleteSubtopic = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if subtopic exists
        const existingSubtopic = await prisma_1.prisma.subtopic.findUnique({
            where: { id },
        });
        if (!existingSubtopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Subtópico não encontrado'));
        }
        // Delete subtopic (cascade will handle related records)
        await prisma_1.prisma.subtopic.delete({
            where: { id },
        });
        res.json((0, response_1.createSuccessResponse)(null, 'Subtópico deletado com sucesso'));
    }
    catch (error) {
        console.error('Delete subtopic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.deleteSubtopic = deleteSubtopic;
//# sourceMappingURL=topicController.js.map