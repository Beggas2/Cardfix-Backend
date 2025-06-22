"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceAnalysisService = exports.PerformanceAnalysisService = void 0;
const prisma_1 = require("../utils/prisma");
class PerformanceAnalysisService {
    async getOverallPerformance(userId) {
        const allStudySessions = await prisma_1.prisma.studySession.findMany({
            where: { userId },
            include: {
                card: {
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
                },
            },
        });
        const overallMetrics = this.calculateMetrics(allStudySessions);
        const contestIds = new Set(allStudySessions.map((session) => session.contestId));
        return {
            ...overallMetrics,
            contestsCount: contestIds.size,
        };
    }
    async getPerformanceByTopic(userId, contestId) {
        const contest = await prisma_1.prisma.contest.findUnique({
            where: { id: contestId },
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
            throw new Error("Contest not found");
        }
        const topicPerformance = [];
        for (const contestTopic of contest.contestTopics) {
            const topic = contestTopic.topic;
            const topicSessions = await prisma_1.prisma.studySession.findMany({
                where: {
                    userId,
                    contestId,
                    subtopic: {
                        topicId: topic.id,
                    },
                },
            });
            const topicMetrics = this.calculateMetrics(topicSessions);
            const subtopicPerformance = await this.calculateSubtopicPerformance(userId, topic.subtopics, topicSessions);
            topicPerformance.push({
                topicId: topic.id,
                topicName: topic.name,
                ...topicMetrics,
                subtopicPerformance,
            });
        }
        return topicPerformance;
    }
    async getPerformanceBySubtopic(userId, topicId, contestId) {
        const topic = await prisma_1.prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                subtopics: true,
            },
        });
        if (!topic) {
            throw new Error("Topic not found");
        }
        const subtopicPerformance = [];
        for (const subtopic of topic.subtopics) {
            const subtopicSessions = await prisma_1.prisma.studySession.findMany({
                where: {
                    userId,
                    contestId,
                    subtopicId: subtopic.id,
                },
            });
            const subtopicMetrics = this.calculateMetrics(subtopicSessions);
            const cardsTotal = await prisma_1.prisma.card.count({
                where: { subtopicId: subtopic.id },
            });
            const cardsLearned = await prisma_1.prisma.userCard.count({
                where: {
                    userId,
                    subtopicId: subtopic.id,
                    status: "graduated",
                },
            });
            const cardsToReview = await prisma_1.prisma.userCard.count({
                where: {
                    userId,
                    subtopicId: subtopic.id,
                    nextReviewTime: { lte: new Date() },
                },
            });
            const avgEaseResult = await prisma_1.prisma.studySession.aggregate({
                where: {
                    userId,
                    subtopicId: subtopic.id,
                },
                _avg: {
                    easeFactor: true,
                },
            });
            const averageEaseFactor = avgEaseResult._avg.easeFactor || 2.5;
            subtopicPerformance.push({
                subtopicId: subtopic.id,
                subtopicName: subtopic.name,
                cardsTotal,
                cardsLearned,
                cardsToReview,
                averageEaseFactor,
                ...subtopicMetrics,
            });
        }
        return subtopicPerformance;
    }
    async getDailyPerformance(userId, contestId) {
        const studySessions = await prisma_1.prisma.studySession.findMany({
            where: {
                userId,
                contestId,
            },
            orderBy: {
                reviewTime: "asc",
            },
        });
        return this.calculateDailyProgress(studySessions);
    }
    calculateMetrics(studySessions) {
        if (studySessions.length === 0) {
            return {
                totalStudyTime: 0,
                totalReviews: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                accuracy: 0,
                averageResponseTime: 0,
                streakDays: 0,
                lastStudyDate: null,
            };
        }
        const totalReviews = studySessions.length;
        const correctAnswers = studySessions.filter((s) => s.correct).length;
        const incorrectAnswers = totalReviews - correctAnswers;
        const accuracy = totalReviews > 0 ? (correctAnswers / totalReviews) * 100 : 0;
        const totalStudyTime = studySessions.reduce((sum, session) => {
            return sum + (session.reviewTime || 30); // Default 30 seconds if no review time
        }, 0);
        const averageResponseTime = totalStudyTime / totalReviews;
        const streakDays = this.calculateStreakDays(studySessions);
        const lastStudyDate = studySessions.length > 0
            ? new Date(Math.max(...studySessions.map((s) => new Date(s.reviewTime).getTime())))
            : null;
        return {
            totalStudyTime,
            totalReviews,
            correctAnswers,
            incorrectAnswers,
            accuracy,
            averageResponseTime,
            streakDays,
            lastStudyDate,
        };
    }
    async calculateTopicPerformance(userId, contestTopics, allStudySessions) {
        const topicPerformance = [];
        for (const contestTopic of contestTopics) {
            const topic = contestTopic.topic;
            const topicSessions = allStudySessions.filter((session) => session.subtopic.topicId === topic.id);
            const topicMetrics = this.calculateMetrics(topicSessions);
            const subtopicPerformance = await this.calculateSubtopicPerformance(userId, topic.subtopics, topicSessions);
            topicPerformance.push({
                topicId: topic.id,
                topicName: topic.name,
                ...topicMetrics,
                subtopicPerformance,
            });
        }
        return topicPerformance;
    }
    async calculateSubtopicPerformance(userId, subtopics, allStudySessions) {
        const subtopicPerformance = [];
        for (const subtopic of subtopics) {
            const subtopicSessions = allStudySessions.filter((session) => session.subtopicId === subtopic.id);
            const subtopicMetrics = this.calculateMetrics(subtopicSessions);
            const cardsTotal = subtopic.cards ? subtopic.cards.length : 0; // Handle case where cards might not be included
            const cardsLearned = await prisma_1.prisma.userCard.count({
                where: {
                    userId,
                    subtopicId: subtopic.id,
                    status: "graduated",
                },
            });
            const cardsToReview = await prisma_1.prisma.userCard.count({
                where: {
                    userId,
                    subtopicId: subtopic.id,
                    nextReviewTime: { lte: new Date() },
                },
            });
            const avgEaseResult = await prisma_1.prisma.studySession.aggregate({
                where: {
                    userId,
                    subtopicId: subtopic.id,
                },
                _avg: {
                    easeFactor: true,
                },
            });
            const averageEaseFactor = avgEaseResult._avg.easeFactor || 2.5;
            subtopicPerformance.push({
                subtopicId: subtopic.id,
                subtopicName: subtopic.name,
                cardsTotal,
                cardsLearned,
                cardsToReview,
                averageEaseFactor,
                ...subtopicMetrics,
            });
        }
        return subtopicPerformance;
    }
    calculateDailyProgress(studySessions) {
        const dailyData = new Map();
        studySessions.forEach((session) => {
            const date = new Date(session.reviewTime).toISOString().split("T")[0];
            if (!dailyData.has(date)) {
                dailyData.set(date, {
                    date,
                    reviewsCount: 0,
                    correctCount: 0,
                    studyTimeMinutes: 0,
                    newCardsLearned: 0,
                });
            }
            const dayData = dailyData.get(date);
            dayData.reviewsCount++;
            if (session.correct) {
                dayData.correctCount++;
            }
            dayData.studyTimeMinutes += (session.reviewTime || 30) / 60; // Convert to minutes
            if (session.correct && session.repetitions === 1) {
                dayData.newCardsLearned++;
            }
        });
        return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    calculateDifficultyDistribution(studySessions) {
        const difficultyMap = new Map();
        studySessions.forEach((session) => {
            let difficulty;
            if (session.easeFactor >= 2.8) {
                difficulty = "easy";
            }
            else if (session.easeFactor >= 2.3) {
                difficulty = "medium";
            }
            else {
                difficulty = "hard";
            }
            if (!difficultyMap.has(difficulty)) {
                difficultyMap.set(difficulty, { count: 0, correct: 0 });
            }
            const stats = difficultyMap.get(difficulty);
            stats.count++;
            if (session.correct) {
                stats.correct++;
            }
        });
        return Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
            difficulty: difficulty,
            count: stats.count,
            accuracy: stats.count > 0 ? (stats.correct / stats.count) * 100 : 0,
        }));
    }
    calculateStreakDays(studySessions) {
        if (studySessions.length === 0)
            return 0;
        const sessionsByDate = new Map();
        studySessions.forEach((session) => {
            const date = new Date(session.reviewTime).toISOString().split("T")[0];
            if (!sessionsByDate.has(date)) {
                sessionsByDate.set(date, []);
            }
            sessionsByDate.get(date).push(session);
        });
        const dates = Array.from(sessionsByDate.keys()).sort().reverse();
        let streak = 0;
        let currentDate = new Date();
        for (const date of dates) {
            const sessionDate = new Date(date);
            const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === streak) {
                streak++;
                currentDate = sessionDate;
            }
            else if (daysDiff > streak + 1) {
                break;
            }
        }
        return streak;
    }
}
exports.PerformanceAnalysisService = PerformanceAnalysisService;
exports.performanceAnalysisService = new PerformanceAnalysisService();
//# sourceMappingURL=performanceAnalysisService.js.map