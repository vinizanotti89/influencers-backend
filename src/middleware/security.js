import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet'; // Adicionar helmet para headers de segurança adicionais

// Rate Limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por windowMs
  message: {
    error: 'Muitas requisições deste IP, por favor tente novamente após 15 minutos'
  }
});

// API Key Validation
export const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'API Key inválida ou não fornecida'
    });
  }

  next();
};

// Request Sanitization
export const sanitizeRequest = (req, res, next) => {
  // Middleware express-mongo-sanitize
  mongoSanitize()(req, res, next);
};

// Security Headers using Helmet
export const securityHeaders = (req, res, next) => {
  helmet()(req, res, next);
};

// CORS configuration
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
};