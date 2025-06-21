import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import contestRoutes from './routes/contests';
import editalRoutes from './routes/editais';
import cardRoutes from './routes/cards';
import studyRoutes from './routes/study';
import topicRoutes from './routes/topics';

// Import middleware
import { errorHandler, notFound } from './middleware/error';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://cardfix-frontend.vercel.app'],
  credentials: true,
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for uploaded files)
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

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
app.use('/api/auth', authRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/editais', editalRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/study', studyRoutes);
app.use('/api', topicRoutes); // topics and subtopics

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
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS habilitado para: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`📁 Diretório de uploads: ${uploadDir}`);
});

export default app;

