"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const contests_1 = __importDefault(require("./routes/contests"));
const editais_1 = __importDefault(require("./routes/editais"));
const cards_1 = __importDefault(require("./routes/cards"));
const study_1 = __importDefault(require("./routes/study"));
const topics_1 = __importDefault(require("./routes/topics"));
const performance_1 = __importDefault(require("./routes/performance"));
// Import middleware
const error_1 = require("./middleware/error");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001');
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'https://cardfix-frontend.vercel.app'],
    credentials: true,
}));
// Logging middleware
app.use((0, morgan_1.default)('combined'));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static files (for uploaded files)
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', uploadDir)));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/contests', contests_1.default);
app.use('/api/editais', editais_1.default);
app.use('/api/cards', cards_1.default);
app.use('/api/study', study_1.default);
app.use('/api/performance', performance_1.default);
app.use('/api', topics_1.default); // topics and subtopics
// Welcome endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Backend do Aplicativo de Concursos',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health',
    });
});
// Error handling middleware (must be last)
app.use(error_1.notFound);
app.use(error_1.errorHandler);
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS habilitado para: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    console.log(`📁 Diretório de uploads: ${uploadDir}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map