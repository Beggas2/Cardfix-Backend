"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteCards = exports.generateCards = exports.deleteCard = exports.updateCard = exports.getCard = exports.getCards = exports.createCard = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const advancedAIService_1 = require("../services/advancedAIService");
const createCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subtopicId, front, back } = req.body;
        // Validate input
        if (!subtopicId || !front || !back) {
            return res.status(400).json((0, response_1.createErrorResponse)('Subtópico, frente e verso do card são obrigatórios'));
        }
        // Check if subtopic exists
        const subtopic = await prisma_1.prisma.subtopic.findUnique({
            where: { id: subtopicId },
        });
        if (!subtopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Subtópico não encontrado'));
        }
        // Create card
        const card = await prisma_1.prisma.card.create({
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
        res.status(201).json((0, response_1.createSuccessResponse)(card, 'Card criado com sucesso'));
    }
    catch (error) {
        console.error('Create card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.createCard = createCard;
const getCards = async (req, res) => {
    try {
        const { subtopicId } = req.query;
        const whereClause = {};
        if (subtopicId) {
            whereClause.subtopicId = subtopicId;
        }
        const cards = await prisma_1.prisma.card.findMany({
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
        res.json((0, response_1.createSuccessResponse)(cards, 'Cards recuperados com sucesso'));
    }
    catch (error) {
        console.error('Get cards error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getCards = getCards;
const getCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await prisma_1.prisma.card.findUnique({
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
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado'));
        }
        res.json((0, response_1.createSuccessResponse)(card, 'Card recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getCard = getCard;
const updateCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { front, back } = req.body;
        // Check if card exists and belongs to user
        const existingCard = await prisma_1.prisma.card.findFirst({
            where: { id, createdBy: userId },
        });
        if (!existingCard) {
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado ou você não tem permissão para editá-lo'));
        }
        // Update card
        const card = await prisma_1.prisma.card.update({
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
        res.json((0, response_1.createSuccessResponse)(card, 'Card atualizado com sucesso'));
    }
    catch (error) {
        console.error('Update card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.updateCard = updateCard;
const deleteCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if card exists and belongs to user
        const existingCard = await prisma_1.prisma.card.findFirst({
            where: { id, createdBy: userId },
        });
        if (!existingCard) {
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado ou você não tem permissão para deletá-lo'));
        }
        // Delete card
        await prisma_1.prisma.card.delete({
            where: { id },
        });
        res.json((0, response_1.createSuccessResponse)(null, 'Card deletado com sucesso'));
    }
    catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.deleteCard = deleteCard;
const generateCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subtopicId, contestId, count = 5 } = req.body;
        // Validate input
        if (!subtopicId || !contestId) {
            return res.status(400).json((0, response_1.createErrorResponse)('Subtópico e concurso são obrigatórios'));
        }
        // Check subscription limits for free users
        if (req.user.subscriptionTier === 'free') {
            // Check if user has already generated cards for this subtopic
            const existingCards = await prisma_1.prisma.card.findMany({
                where: {
                    subtopicId,
                    createdBy: userId,
                },
            });
            if (existingCards.length > 0) {
                return res.status(403).json((0, response_1.createErrorResponse)('Usuários gratuitos podem gerar cards apenas uma vez por subtópico. Considere fazer upgrade para premium.'));
            }
        }
        // Get subtopic and related data
        const subtopic = await prisma_1.prisma.subtopic.findUnique({
            where: { id: subtopicId },
            include: {
                topic: true,
            },
        });
        if (!subtopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Subtópico não encontrado'));
        }
        // Get contest data
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Extract institution and contest type from contest name
        const contestType = contest.selectedOffice || '';
        const institution = contest.name.split(' ')[0] || '';
        // Generate cards using advanced AI service
        const result = await advancedAIService_1.advancedAIService.generateIntelligentCards({
            subtopicId,
            userId,
            userTier: req.user.subscriptionTier,
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
            return res.json((0, response_1.createSuccessResponse)({ cards: result.cards, count: result.cards.length, isReused: true }, result.message));
        }
        // Save generated cards to database
        const savedCards = [];
        for (const generatedCard of result.cards) {
            if (!generatedCard.isReused) {
                const card = await prisma_1.prisma.card.create({
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
        res.status(201).json((0, response_1.createSuccessResponse)({
            cards: savedCards,
            count: savedCards.length,
            isReused: false,
            priorityData: result.priorityData
        }, result.message));
    }
    catch (error) {
        console.error('Generate cards error:', error);
        // Handle specific AI service errors
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return res.status(500).json((0, response_1.createErrorResponse)('Erro de configuração do serviço de IA', error.message));
            }
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                return res.status(429).json((0, response_1.createErrorResponse)('Limite de uso da IA atingido. Tente novamente mais tarde.', error.message));
            }
        }
        res.status(500).json((0, response_1.createErrorResponse)('Erro ao gerar cards com IA', error.message));
    }
};
exports.generateCards = generateCards;
const bulkDeleteCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardIds } = req.body;
        if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return res.status(400).json((0, response_1.createErrorResponse)('Lista de IDs de cards é obrigatória'));
        }
        // Delete cards that belong to the user
        const result = await prisma_1.prisma.card.deleteMany({
            where: {
                id: { in: cardIds },
                createdBy: userId,
            },
        });
        res.json((0, response_1.createSuccessResponse)({ deletedCount: result.count }, `${result.count} cards deletados com sucesso`));
    }
    catch (error) {
        console.error('Bulk delete cards error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.bulkDeleteCards = bulkDeleteCards;
//# sourceMappingURL=cardController.js.map