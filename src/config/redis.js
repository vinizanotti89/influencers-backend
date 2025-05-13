import { createClient } from 'redis';
import logger from './logger.js';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Número máximo de tentativas de reconexão excedido');
      }
      return Math.min(retries * 100, 3000);
    },
  }
});

redisClient.on('error', (err) => {
  logger.error('Erro no Redis:', err);
});

redisClient.on('connect', () => {
  logger.info('Conectado ao Redis');
});

redisClient.on('reconnecting', () => {
  logger.info('Reconectando ao Redis...');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Falha ao conectar ao Redis:', error);
  }
};

// Middleware de cache
export const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Modifica o res.json para armazenar a resposta no cache
      const originalJson = res.json;
      res.json = function (body) {
        redisClient.setEx(key, duration, JSON.stringify(body));
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Erro ao acessar cache:', error);
      next();
    }
  };
};

// Função para limpar cache
export const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache limpo para padrão: ${pattern}`);
    }
  } catch (error) {
    logger.error('Erro ao limpar cache:', error);
  }
};

export default redisClient;