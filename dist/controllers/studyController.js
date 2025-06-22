"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextReviewCard = exports.getStudyHistory = exports.getLearningProgress = exports.getCardsForReview = exports.reviewCard = void 0;
const prisma_1 = require("../utils/prisma");
const response_1 = require("../utils/response");
const reviewCard = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { cardId, quality } = req.body;
        if (quality < 0 || quality > 5) {
            return res.status(400).json((0, response_1.createErrorResponse)('Qualidade da revisão inválida (0-5)'));
        }
        const card = await prisma_1.prisma.card.findUnique({
            where: { id: cardId },
            include: {
                subtopic: {
                    include: {
                        topic: {
                            include: {
                                contestTopics: true,
                            },
                        },
                    },
                },
            },
        });
        if (!card) {
            return res.status(404).json((0, response_1.createErrorResponse)('Card não encontrado'));
        }
        // Find the contest associated with this card through its topic
        const contestTopic = card.subtopic.topic.contestTopics.find(ct => ct.userId === userId);
        if (!contestTopic) {
            return res.status(404).json((0, response_1.createErrorResponse)('Concurso associado ao card não encontrado para este usuário'));
        }
        const contestId = contestTopic.contestId;
        // Get or create UserCard entry
        let userCard = await prisma_1.prisma.userCard.findUnique({
            where: {
                userId_cardId: {
                    userId,
                    cardId,
                },
            },
        });
        let repetitions = userCard ? userCard.repetitions : 0;
        let easeFactor = userCard ? userCard.easeFactor : 2.5;
        let interval = userCard ? userCard.interval : 0;
        let correctStreak = userCard ? userCard.correctStreak : 0;
        let incorrectStreak = userCard ? userCard.incorrectStreak : 0;
        let totalCorrectReviews = userCard ? userCard.totalCorrectReviews : 0;
        let totalIncorrectReviews = userCard ? userCard.totalIncorrectReviews : 0;
        let status = userCard ? userCard.status : 'new'; // Asserção de tipo adicionada
        // SM-2 algorithm logic
        if (quality >= 3) {
            correctStreak++;
            incorrectStreak = 0;
            totalCorrectReviews++;
            if (repetitions === 0) {
                interval = 1;
            }
            else if (repetitions === 1) {
                interval = 6;
            }
            else {
                interval = Math.round(interval * easeFactor);
            }
        }
        else {
            repetitions = 0;
            interval = 1;
            correctStreak = 0;
            incorrectStreak++;
            totalIncorrectReviews++;
        }
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }
        repetitions++;
        const nextReviewTime = new Date();
        nextReviewTime.setDate(nextReviewTime.getDate() + interval);
        if (interval >= 21 && quality >= 3) {
            status = 'graduated';
        }
        else if (repetitions > 0 && quality >= 3) {
            status = 'review';
        }
        else {
            status = 'learning';
        }
        userCard = await prisma_1.prisma.userCard.upsert({
            where: {
                userId_cardId: {
                    userId,
                    cardId,
                },
            },
            update: {
                repetitions,
                easeFactor,
                interval,
                nextReviewTime,
                lastReviewed: new Date(),
                correctStreak,
                incorrectStreak,
                totalCorrectReviews,
                totalIncorrectReviews,
                status,
            },
            create: {
                userId,
                cardId,
                contestId, // Associate with the contest
                subtopicId: card.subtopicId,
                repetitions,
                easeFactor,
                interval,
                nextReviewTime,
                lastReviewed: new Date(),
                correctStreak,
                incorrectStreak,
                totalCorrectReviews,
                totalIncorrectReviews,
                status,
            },
            include: {
                card: true,
            },
        });
        // Record study session
        await prisma_1.prisma.studySession.create({
            data: {
                userId,
                cardId,
                contestId,
                subtopicId: card.subtopicId,
                quality, // Campo 'quality' agora é reconhecido
                repetitions,
                easeFactor,
                interval,
                reviewTime: new Date(),
                correct: quality >= 3,
            },
        });
        res.json((0, response_1.createSuccessResponse)(userCard, 'Card revisado com sucesso'));
    }
    catch (error) {
        console.error('Review card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.reviewCard = reviewCard;
const getCardsForReview = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId, subtopicId } = req.query;
        const whereClause = {
            userId,
            nextReviewTime: { lte: new Date() },
        };
        if (contestId) {
            whereClause.contestId = contestId;
        }
        if (subtopicId) {
            whereClause.subtopicId = subtopicId;
        }
        const cardsToReview = await prisma_1.prisma.userCard.findMany({
            where: whereClause,
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
            orderBy: { nextReviewTime: 'asc' },
            take: 20, // Limit to 20 cards for review at a time
        });
        res.json((0, response_1.createSuccessResponse)(cardsToReview, 'Cards para revisão recuperados com sucesso'));
    }
    catch (error) {
        console.error('Get cards for review error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getCardsForReview = getCardsForReview;
const getLearningProgress = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId, subtopicId } = req.query;
        const whereClause = {
            userId,
        };
        if (contestId) {
            whereClause.contestId = contestId;
        }
        if (subtopicId) {
            whereClause.subtopicId = subtopicId;
        }
        const totalCards = await prisma_1.prisma.userCard.count({
            where: whereClause,
        });
        const newCards = await prisma_1.prisma.userCard.count({
            where: { ...whereClause, status: 'new' },
        });
        const learningCards = await prisma_1.prisma.userCard.count({
            where: { ...whereClause, status: 'learning' },
        });
        const reviewCards = await prisma_1.prisma.userCard.count({
            where: { ...whereClause, status: 'review' },
        });
        const graduatedCards = await prisma_1.prisma.userCard.count({
            where: { ...whereClause, status: 'graduated' },
        });
        const progress = {
            totalCards,
            newCards,
            learningCards,
            reviewCards,
            graduatedCards,
        };
        res.json((0, response_1.createSuccessResponse)(progress, 'Progresso de aprendizado recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get learning progress error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getLearningProgress = getLearningProgress;
const getStudyHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId, subtopicId, limit = '100' } = req.query;
        const whereClause = {
            userId,
        };
        if (contestId) {
            whereClause.contestId = contestId;
        }
        if (subtopicId) {
            whereClause.subtopicId = subtopicId;
        }
        const history = await prisma_1.prisma.studySession.findMany({
            where: whereClause,
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
            orderBy: { reviewTime: 'desc' },
            take: parseInt(limit),
        });
        res.json((0, response_1.createSuccessResponse)(history, 'Histórico de estudo recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get study history error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getStudyHistory = getStudyHistory;
const getNextReviewCard = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId, subtopicId } = req.query;
        const whereClause = {
            userId,
            nextReviewTime: { lte: new Date() },
        };
        if (contestId) {
            whereClause.contestId = contestId;
        }
        if (subtopicId) {
            whereClause.subtopicId = subtopicId;
        }
        const nextCard = await prisma_1.prisma.userCard.findFirst({
            where: whereClause,
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
            orderBy: { nextReviewTime: 'asc' },
        });
        res.json((0, response_1.createSuccessResponse)(nextCard, 'Próximo card para revisão recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get next review card error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getNextReviewCard = getNextReviewCard;
//# sourceMappingURL=studyController.js.map