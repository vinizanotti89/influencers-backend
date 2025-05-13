console.log('[DEBUG] Starting app.js');

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import dotenv from 'dotenv';
console.log('[DEBUG] dotenv loaded');
import morgan from 'morgan';
console.log('[DEBUG] core modules imported');
import logger from './config/logger.js';
console.log('[DEBUG] custom modules imported');
import apiRoutes from './routes/api.js';
import socialApiRoutes from './routes/socialApiRoutes.js';


process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar aplicação Express
const app = express();

// Middlewares
app.use(helmet()); // Segurança HTTP
app.use(cors({
  origin: 'https://frontendpaineladm.vercel.app'
})); // Permitir cross-origin requests
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

// Logging
app.use(morgan('dev', { stream: { write: message => console.log('[MORGAN]', message.trim()) } }));

// Rotas de API
app.use('/api', apiRoutes);
app.use('/api/social', socialApiRoutes);

// Rota básica de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  logger.error(`Uncaught error: ${err.message}`);
  logger.error(err.stack);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Função para conectar ao MongoDB
const connectToDatabase = async () => {
  try {
    console.log('[DEBUG] Connecting to Mongo:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('[ERROR] MongoDB connection failed:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Função para iniciar o servidor
const startServer = async () => {
  try {
    console.log('[INIT] Starting server...');
    await connectToDatabase();
    console.log('[DB] Mongo connected');

    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[FAIL] Server startup error:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Exportar o app para testes
export { app, startServer };

// Iniciar o servidor se este arquivo for executado diretamente
if (process.env.NODE_ENV !== 'test') {
  console.log('[DEBUG] startServer() is being called');
  startServer();
}