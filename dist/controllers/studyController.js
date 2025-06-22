"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudyStatsController = exports.removeCardFromStudy = exports.addCardToStudy = exports.reviewCard = exports.getStudySession = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const spacedRepetition_1 = require("../utils/spacedRepetition");
const getStudySession = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { contestId } = req.params;
        const { limit = 20 } = req.query;
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Get user cards for this contest
        const userCards = await prisma_1.prisma.userCard.findMany({
            where: {
                userId,
                contestId,
            },
            include: {
                card: {
                    include: {
                        subtopic: {
                            include: {
                                topic: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { nextReviewTime: 'asc' },
                { createdAt: 'asc' },
            ],
        });
        // Filter cards that are due for review
        const dueCards = (0, spacedRepetition_1.getCardsForReview)(userCards);
        // Limit the number of cards for this session
        const sessionCards = dueCards.slice(0, parseInt(limit));
        // Get study statistics
        const stats = (0, spacedRepetition_1.getStudyStats)(userCards);
        res.json((0, response_1.createSuccessResponse)({
            cards: sessionCards,
            stats,
            sessionSize: sessionCards.length,
            totalDue: dueCards.length,
        }, 'Sessão de estudo recuperada com sucesso'));
    }
    catch (error) {
        console.error('Get study session error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getStudySession = getStudySession;
const reviewCard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cardId, quality } = req.body;
        // Validate input
        if (!cardId || quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json((0, response_1.createErrorResponse)('ID do card e qualidade (0-5) são obrigatórios'));
        }
        // Get user card
        const userCard = await prisma_1.prisma.userCard.findFirst({
            where: {
                userId,
                cardId,
            },
            include: {
                card: true,
            },
        });
        if (!userCard) {
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado para este usuário'));
        }
        // Calculate next review using spaced repetition algorithm
        const reviewResult = (0, spacedRepetition_1.calculateNextReview)(quality, userCard.repetitions, userCard.easeFactor, userCard.interval);
        // Update status based on performance
        let newStatus = userCard.status;
        if (quality >= 3) {
            // Correct response
            if (userCard.status === 'new') {
                newStatus = 'learning';
            }
            else if (userCard.status === 'learning' && reviewResult.repetitions >= 2) {
                newStatus = 'review';
            }
            else if (reviewResult.repetitions >= 5) {
                newStatus = 'graduated';
            }
        }
        else {
            // Incorrect response - back to learning
            newStatus = 'learning';
        }
        // Update user card with new review data
        const updatedUserCard = await prisma_1.prisma.userCard.update({
            where: { id: userCard.id },
            data: {
                repetitions: reviewResult.repetitions,
                easeFactor: reviewResult.easeFactor,
                interval: reviewResult.interval,
                nextReviewTime: reviewResult.nextReviewTime,
                lastReviewed: new Date(),
                status: newStatus,
                totalCorrectReviews: quality >= 3
                    ? userCard.totalCorrectReviews + 1
                    : userCard.totalCorrectReviews,
                totalIncorrectReviews: quality < 3
                    ? userCard.totalIncorrectReviews + 1
                    : userCard.totalIncorrectReviews,
                correctStreak: quality >= 3
                    ? userCard.correctStreak + 1
                    : 0,
                incorrectStreak: quality < 3
                    ? userCard.incorrectStreak + 1
                    : 0,
            },
            include: {
                card: {
                    include: {
                        subtopic: {
                            include: {
                                topic: true,
                            },
                        },
                    },
                },
            },
        });
        res.json((0, response_1.createSuccessResponse)({
            userCard: updatedUserCard,
            reviewResult: {
                quality,
                nextReview: reviewResult.nextReviewTime,
                interval: reviewResult.interval,
                status: newStatus,
            },
        }, 'Card revisado com sucesso'));
    }
    catch (error) {
        console.error('Review card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.reviewCard = reviewCard;
const addCardToStudy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cardId, contestId } = req.body;
        // Validate input
        if (!cardId || !contestId) {
            return res.status(400).json((0, response_1.createErrorResponse)('ID do card e do concurso são obrigatórios'));
        }
        // Check if card exists
        const card = await prisma_1.prisma.card.findUnique({
            where: { id: cardId },
            include: {
                subtopic: true,
            },
        });
        if (!card) {
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado'));
        }
        // Check if contest exists and belongs to user
        const contest = await prisma_1.prisma.contest.findFirst({
            where: { id: contestId, userId },
        });
        if (!contest) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso não encontrado'));
        }
        // Check if user card already exists
        const existingUserCard = await prisma_1.prisma.userCard.findFirst({
            where: {
                userId,
                cardId,
            },
        });
        if (existingUserCard) {
            return res.status(400).json((0, response_1.createErrorResponse)('Card já está sendo estudado por este usuário'));
        }
        // Create user card
        const userCard = await prisma_1.prisma.userCard.create({
            data: {
                userId,
                cardId,
                contestId,
                subtopicId: card.subtopicId,
                repetitions: 0,
                easeFactor: 2.5,
                interval: 1,
                status: 'new',
                totalCorrectReviews: 0,
                totalIncorrectReviews: 0,
                correctStreak: 0,
                incorrectStreak: 0,
            },
            include: {
                card: {
                    include: {
                        subtopic: {
                            include: {
                                topic: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(201).json((0, response_1.createSuccessResponse)(userCard, 'Card adicionado ao estudo com sucesso'));
    }
    catch (error) {
        console.error('Add card to study error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.addCardToStudy = addCardToStudy;
const removeCardFromStudy = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { cardId } = req.params;
        // Find and delete user card
        const userCard = await prisma_1.prisma.userCard.findFirst({
            where: {
                userId,
                cardId,
            },
        });
        if (!userCard) {
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado no estudo deste usuário'));
        }
        await prisma_1.prisma.userCard.delete({
            where: { id: userCard.id },
        });
        res.json((0, response_1.createSuccessResponse)(null, 'Card removido do estudo com sucesso'));
    }
    catch (error) {
        console.error('Remove card from study error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.removeCardFromStudy = removeCardFromStudy;
const getStudyStatsController = async (req, res) => {
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
        // Get user cards for this contest
        const userCards = await prisma_1.prisma.userCard.findMany({
            where: {
                userId,
                contestId,
            },
            include: {
                card: {
                    include: {
                        subtopic: {
                            include: {
                                topic: true,
                            },
                        },
                    },
                },
            },
        });
        // Calculate overall stats
        const overallStats = (0, spacedRepetition_1.getStudyStats)(userCards);
        // Calculate stats by topic
        const topicStats = userCards.reduce((acc, userCard) => {
            const topicName = userCard.card.subtopic.topic.name;
            if (!acc[topicName]) {
                acc[topicName] = [];
            }
            acc[topicName].push(userCard);
            return acc;
        }, {});
        const topicStatsFormatted = Object.entries(topicStats).map(([topicName, cards]) => ({
            topicName,
            stats: (0, spacedRepetition_1.getStudyStats)(cards),
        }));
        // Calculate stats by subtopic
        const subtopicStats = userCards.reduce((acc, userCard) => {
            const subtopicName = userCard.card.subtopic.name;
            if (!acc[subtopicName]) {
                acc[subtopicName] = [];
            }
            acc[subtopicName].push(userCard);
            return acc;
        }, {});
        const subtopicStatsFormatted = Object.entries(subtopicStats).map(([subtopicName, cards]) => ({
            subtopicName,
            stats: (0, spacedRepetition_1.getStudyStats)(cards),
        }));
        res.json((0, response_1.createSuccessResponse)({
            overall: overallStats,
            byTopic: topicStatsFormatted,
            bySubtopic: subtopicStatsFormatted,
            contest: {
                id: contest.id,
                name: contest.name,
                targetDate: contest.targetDate,
            },
        }, 'Estatísticas de estudo recuperadas com sucesso'));
    }
    catch (error) {
        console.error('Get study stats error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getStudyStatsController = getStudyStatsController;
//# sourceMappingURL=studyController.js.map