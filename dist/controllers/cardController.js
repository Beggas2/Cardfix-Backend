"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkGenerateCards = exports.generateCards = exports.deleteCard = exports.updateCard = exports.getCard = exports.getCards = exports.createCard = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const aiService_1 = require("../services/aiService");
const createCard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { subtopicId, front, back, difficulty = 'medium' } = req.body;
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
        res.status(201).json((0, response_1.createSuccessResponse)(card, 'Card criado com sucesso'));
    }
    catch (error) {
        console.error('Create card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.createCard = createCard;
const getCards = async (req, res) => {
    try {
        const { subtopicId, topicId, contestId } = req.query;
        const whereClause = {};
        if (subtopicId) {
            whereClause.subtopicId = subtopicId;
        }
        else if (topicId) {
            whereClause.subtopic = {
                topicId: topicId,
            };
        }
        else if (contestId) {
            whereClause.subtopic = {
                topic: {
                    contestTopics: {
                        some: {
                            contestId: contestId,
                        },
                    },
                },
            };
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
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
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
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getCard = getCard;
const updateCard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { front, back, difficulty } = req.body;
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
            data: { front, back, difficulty },
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
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.updateCard = updateCard;
const deleteCard = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.deleteCard = deleteCard;
const generateCards = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        // Generate cards using AI
        const generatedCards = await (0, aiService_1.generateCardsWithRetry)({
            subtopicName: subtopic.name,
            topicName: subtopic.topic.name,
            contestName: contest.name,
            selectedOffice: contest.selectedOffice,
            count,
        });
        // Save generated cards to database
        const savedCards = [];
        for (const generatedCard of generatedCards) {
            const card = await prisma_1.prisma.card.create({
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
        res.status(201).json((0, response_1.createSuccessResponse)({ cards: savedCards, count: savedCards.length }, `${savedCards.length} cards gerados com sucesso`));
    }
    catch (error) {
        console.error('Generate cards error:', error);
        // Handle specific AI service errors
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return res.status(500).json((0, response_1.createErrorResponse)('Erro de configuração do serviço de IA'));
            }
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                return res.status(429).json((0, response_1.createErrorResponse)('Limite de uso da IA atingido. Tente novamente mais tarde.'));
            }
        }
        res.status(500).json((0, response_1.createErrorResponse)('Erro ao gerar cards com IA'));
    }
};
exports.generateCards = generateCards;
const bulkGenerateCards = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { contestId, topicIds = [], subtopicIds = [] } = req.body;
        // Validate input
        if (!contestId) {
            return res.status(400).json((0, response_1.createErrorResponse)('ID do concurso é obrigatório'));
        }
        // Get contest data
        const contest = await prisma_1.prisma.contest.findFirst({
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
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Determine which subtopics to generate cards for
        let targetSubtopics = [];
        if (subtopicIds.length > 0) {
            // Generate for specific subtopics
            targetSubtopics = await prisma_1.prisma.subtopic.findMany({
                where: {
                    id: { in: subtopicIds },
                },
                include: {
                    topic: true,
                },
            });
        }
        else if (topicIds.length > 0) {
            // Generate for all subtopics of specific topics
            targetSubtopics = await prisma_1.prisma.subtopic.findMany({
                where: {
                    topicId: { in: topicIds },
                },
                include: {
                    topic: true,
                },
            });
        }
        else {
            // Generate for all subtopics in the contest
            targetSubtopics = contest.contestTopics.flatMap(ct => ct.topic.subtopics.map(st => ({
                ...st,
                topic: ct.topic,
            })));
        }
        if (targetSubtopics.length === 0) {
            return res.status(400).json((0, response_1.createErrorResponse)('Nenhum subtópico encontrado para gerar cards'));
        }
        // Generate cards for each subtopic
        const results = [];
        let totalGenerated = 0;
        let errors = [];
        for (const subtopic of targetSubtopics) {
            try {
                // Check if cards already exist for this subtopic
                const existingCards = await prisma_1.prisma.card.findMany({
                    where: { subtopicId: subtopic.id },
                });
                const cardsToGenerate = Math.max(0, 5 - existingCards.length); // Generate up to 5 cards per subtopic
                if (cardsToGenerate > 0) {
                    const generatedCards = await (0, aiService_1.generateCardsWithRetry)({
                        subtopicName: subtopic.name,
                        topicName: subtopic.topic.name,
                        contestName: contest.name,
                        selectedOffice: contest.selectedOffice,
                        count: cardsToGenerate,
                    });
                    // Save generated cards
                    const savedCards = [];
                    for (const generatedCard of generatedCards) {
                        const card = await prisma_1.prisma.card.create({
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
                }
                else {
                    results.push({
                        subtopicId: subtopic.id,
                        subtopicName: subtopic.name,
                        topicName: subtopic.topic.name,
                        generated: 0,
                        existing: existingCards.length,
                        message: 'Subtópico já possui cards suficientes',
                    });
                }
            }
            catch (error) {
                console.error(`Erro ao gerar cards para ${subtopic.name}:`, error);
                errors.push({
                    subtopicId: subtopic.id,
                    subtopicName: subtopic.name,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                });
            }
        }
        res.status(201).json((0, response_1.createSuccessResponse)({
            totalGenerated,
            results,
            errors,
            summary: {
                subtopicsProcessed: targetSubtopics.length,
                successful: results.length,
                failed: errors.length,
            },
        }, `Geração em lote concluída. ${totalGenerated} cards gerados no total.`));
    }
    catch (error) {
        console.error('Bulk generate cards error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro ao gerar cards em lote'));
    }
};
exports.bulkGenerateCards = bulkGenerateCards;
//# sourceMappingURL=cardController.js.map