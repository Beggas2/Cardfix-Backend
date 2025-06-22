"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyPerformance = exports.getPerformanceBySubtopic = exports.getPerformanceByTopic = exports.getOverallPerformance = void 0;
const response_1 = require("../utils/response");
const performanceAnalysisService_1 = require("../services/performanceAnalysisService");
const getOverallPerformance = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const overallPerformance = await performanceAnalysisService_1.performanceAnalysisService.getOverallPerformance(userId);
        res.json((0, response_1.createSuccessResponse)(overallPerformance, 'Performance geral recuperada com sucesso'));
    }
    catch (error) {
        console.error('Get overall performance error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getOverallPerformance = getOverallPerformance;
const getPerformanceByTopic = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.query;
        const performanceByTopic = await performanceAnalysisService_1.performanceAnalysisService.getPerformanceByTopic(userId, contestId);
        res.json((0, response_1.createSuccessResponse)(performanceByTopic, 'Performance por tópico recuperada com sucesso'));
    }
    catch (error) {
        console.error('Get performance by topic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getPerformanceByTopic = getPerformanceByTopic;
const getPerformanceBySubtopic = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { topicId, contestId } = req.query;
        const performanceBySubtopic = await performanceAnalysisService_1.performanceAnalysisService.getPerformanceBySubtopic(userId, topicId, contestId);
        res.json((0, response_1.createSuccessResponse)(performanceBySubtopic, 'Performance por subtópico recuperada com sucesso'));
    }
    catch (error) {
        console.error('Get performance by subtopic error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getPerformanceBySubtopic = getPerformanceBySubtopic;
const getDailyPerformance = async (req, res) => {
    try {
        const userId = req.user.id; // Alterado de userId para id
        const { contestId } = req.query;
        const dailyPerformance = await performanceAnalysisService_1.performanceAnalysisService.getDailyPerformance(userId, contestId);
        res.json((0, response_1.createSuccessResponse)(dailyPerformance, 'Performance diária recuperada com sucesso'));
    }
    catch (error) {
        console.error('Get daily performance error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getDailyPerformance = getDailyPerformance;
//# sourceMappingURL=performanceController.js.map