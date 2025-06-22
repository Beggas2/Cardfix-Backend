"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    // Prisma errors
    if (error.code === 'P2002') {
        return res.status(400).json((0, response_1.createErrorResponse)('Dados duplicados. Este registro já existe.'));
    }
    if (error.code === 'P2025') {
        return res.status(404).json((0, response_1.createErrorResponse)('Registro não encontrado.'));
    }
    // Validation errors
    if (error.name === 'ValidationError') {
        return res.status(400).json((0, response_1.createErrorResponse)('Dados inválidos', error.message));
    }
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json((0, response_1.createErrorResponse)('Token inválido'));
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json((0, response_1.createErrorResponse)('Token expirado'));
    }
    // Default error
    res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
};
exports.errorHandler = errorHandler;
const notFound = (req, res) => {
    res.status(404).json((0, response_1.createErrorResponse)(`Rota não encontrada: ${req.originalUrl}`));
};
exports.notFound = notFound;
//# sourceMappingURL=error.js.map