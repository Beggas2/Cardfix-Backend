"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSubscription = exports.authenticateToken = void 0;
const auth_1 = require("../utils/auth");
const response_1 = require("../utils/response");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json((0, response_1.createErrorResponse)('Token de acesso requerido'));
    }
    try {
        const decoded = (0, auth_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json((0, response_1.createErrorResponse)('Token inválido'));
    }
};
exports.authenticateToken = authenticateToken;
const requireSubscription = (tier) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json((0, response_1.createErrorResponse)('Usuário não autenticado'));
        }
        if (tier === 'paid' && req.user.subscriptionTier === 'free') {
            return res.status(403).json((0, response_1.createErrorResponse)('Assinatura premium requerida para esta funcionalidade'));
        }
        next();
    };
};
exports.requireSubscription = requireSubscription;
//# sourceMappingURL=auth.js.map