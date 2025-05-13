// server/src/app.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import apiRoutes from './routes/api.js';
import socialApiRoutes from './routes/socialApiRoutes.js';

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
app.use(morgan('dev', { stream: { write: message => logger.info(message.trim()) } }));

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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/influencer-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Função para iniciar o servidor
const startServer = async () => {
  try {
    await connectToDatabase();

    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Exportar o app para testes
export { app, startServer };

// Iniciar o servidor se este arquivo for executado diretamente
if (process.env.NODE_ENV !== 'test') {
  startServer();
}