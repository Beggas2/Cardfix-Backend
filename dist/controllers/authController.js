"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../utils/auth");
const response_1 = require("../utils/response");
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json((0, response_1.createErrorResponse)('Email e senha são obrigatórios'));
        }
        if (password.length < 6) {
            return res.status(400).json((0, response_1.createErrorResponse)('Senha deve ter pelo menos 6 caracteres'));
        }
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json((0, response_1.createErrorResponse)('Usuário já existe com este email'));
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                subscriptionTier: 'free',
            },
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionTier: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        // Generate token
        const token = (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
        });
        const response = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscriptionTier: user.subscriptionTier,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
        res.status(201).json((0, response_1.createSuccessResponse)(response, 'Usuário criado com sucesso'));
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json((0, response_1.createErrorResponse)('Email e senha são obrigatórios'));
        }
        // Find user
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json((0, response_1.createErrorResponse)('Credenciais inválidas'));
        }
        // Check password
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json((0, response_1.createErrorResponse)('Credenciais inválidas'));
        }
        // Generate token
        const token = (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
        });
        const response = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscriptionTier: user.subscriptionTier,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
        res.json((0, response_1.createSuccessResponse)(response, 'Login realizado com sucesso'));
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionTier: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json((0, response_1.createErrorResponse)('Usuário não encontrado'));
        }
        res.json((0, response_1.createSuccessResponse)(user, 'Perfil recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { name } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { name },
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionTier: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json((0, response_1.createSuccessResponse)(user, 'Perfil atualizado com sucesso'));
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor'));
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map