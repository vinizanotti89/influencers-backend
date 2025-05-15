import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-jwt-super-secreto';

/**
 * Middleware que requer autenticação
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 */
export const required = async (req, res, next) => {
  try {
    // Verificar se existe um token de autorização
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Extrair o token
    const token = authHeader.substring(7); // Remove 'Bearer ' do início

    try {
      // Verificar e decodificar o token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Buscar usuário no banco de dados
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Anexar o usuário à requisição
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (jwtError) {
      // Erro de verificação do token
      logger.error('JWT verification error:', jwtError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware que torna a autenticação opcional
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 */
export const optional = async (req, res, next) => {
  try {
    // Verificar se existe um token de autorização
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Sem token, mas tudo bem - autenticação é opcional
      return next();
    }

    // Extrair o token
    const token = authHeader.substring(7); // Remove 'Bearer ' do início

    try {
      // Verificar e decodificar o token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Buscar usuário no banco de dados
      const user = await User.findById(decoded.id);

      if (user) {
        // Anexar o usuário à requisição
        req.user = {
          id: user._id,
          email: user.email,
          role: user.role
        };
      }

      next();
    } catch (jwtError) {
      // Erro de verificação do token, mas tudo bem - autenticação é opcional
      logger.warn('Optional JWT verification failed:', jwtError);
      next();
    }
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Para compatibilidade, também exportamos como objeto padrão
const authMiddleware = { required, optional };
export default authMiddleware;