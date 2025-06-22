"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../utils/auth");
const response_1 = require("../utils/response");
const auth_2 = require("../utils/auth");
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json((0, response_1.createErrorResponse)('Email e senha são obrigatórios'));
        }
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                subscriptionTier: 'free',
            },
        });
        const tokenPayload = {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier, // Adicionado asserção de tipo
        };
        const token = (0, auth_2.generateToken)(tokenPayload);
        res.status(201).json((0, response_1.createSuccessResponse)({ user, token }, 'Usuário registrado com sucesso'));
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json((0, response_1.createErrorResponse)('Email e senha são obrigatórios'));
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(400).json((0, response_1.createErrorResponse)('Credenciais inválidas'));
        }
        const passwordMatch = await (0, auth_1.comparePassword)(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json((0, response_1.createErrorResponse)('Credenciais inválidas'));
        }
        const tokenPayload = {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier, // Adicionado asserção de tipo
        };
        const token = (0, auth_2.generateToken)(tokenPayload);
        res.status(200).json((0, response_1.createSuccessResponse)({ user, token }, 'Login realizado com sucesso'));
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, subscriptionTier: true },
        });
        if (!user) {
            return res.status(404).json((0, response_1.createErrorResponse)('Usuário não encontrado'));
        }
        res.json((0, response_1.createSuccessResponse)(user, 'Perfil do usuário recuperado com sucesso'));
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email } = req.body;
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { name, email },
            select: { id: true, name: true, email: true, subscriptionTier: true },
        });
        res.json((0, response_1.createSuccessResponse)(updatedUser, 'Perfil do usuário atualizado com sucesso'));
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json((0, response_1.createErrorResponse)('Erro interno do servidor', error.message));
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map