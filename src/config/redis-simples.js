import { createClient } from 'redis';

console.log('[CONFIG] Inicializando redis-simple.js');

// Cliente dummy para quando o Redis não estiver disponível
const dummyClient = {
  get: async () => null,
  setEx: async () => true,
  keys: async () => [],
  del: async () => true,
  connect: async () => console.log('[REDIS] Usando cliente Redis dummy (modo offline)')
};

// Tentativa de criar um cliente Redis real
let redisClient;
try {
  if (!process.env.REDIS_URL) {
    console.log('[REDIS] Variável REDIS_URL não encontrada, usando cliente dummy');
    redisClient = dummyClient;
  } else {
    console.log('[REDIS] Tentando criar cliente Redis com URL:', process.env.REDIS_URL);
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          console.log(`[REDIS] Tentativa de reconexão ${retries}`);
          if (retries > 3) {
            console.log('[REDIS] Número máximo de tentativas excedido, usando cliente dummy');
            return new Error('Número máximo de tentativas excedido');
          }
          return Math.min(retries * 100, 1000);
        },
      }
    });

    redisClient.on('error', (err) => {
      console.error('[REDIS] Erro:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[REDIS] Conectado com sucesso');
    });
  }
} catch (error) {
  console.error('[REDIS] Erro ao inicializar Redis:', error.message);
  redisClient = dummyClient;
}

// Função de conexão que não falha
export const connectRedis = async () => {
  try {
    if (redisClient !== dummyClient) {
      console.log('[REDIS] Tentando conectar...');
      await redisClient.connect();
    } else {
      await dummyClient.connect();
    }
    return true;
  } catch (error) {
    console.error('[REDIS] Falha ao conectar:', error.message);
    redisClient = dummyClient;
    return false;
  }
};

// Middleware de cache simplificado e à prova de falhas
export const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const key = `cache:${req.originalUrl}`;
      const cachedResponse = await redisClient.get(key);

      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Modifica o res.json para tentar armazenar, mas não falha se der erro
      const originalJson = res.json;
      res.json = function (body) {
        try {
          redisClient.setEx(key, duration, JSON.stringify(body))
            .catch(err => console.error('[REDIS] Erro ao salvar cache:', err.message));
        } catch (error) {
          console.error('[REDIS] Erro ao processar cache:', error.message);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('[REDIS] Erro no middleware de cache:', error.message);
      next();
    }
  };
};

// Função para limpar cache (tolerante a falhas)
export const clearCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[REDIS] Cache limpo para padrão: ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error('[REDIS] Erro ao limpar cache:', error.message);
    return false;
  }
};

console.log('[CONFIG] redis-simple.js carregado com sucesso');

export default redisClient;