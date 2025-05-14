import winston from 'winston';

// Configuração de formato simplificado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    let log = `${timestamp} ${level.toUpperCase()}: ${message}`;
    
    // Adiciona stack trace para erros
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configuração do colorize apenas para console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  customFormat
);

// Configuração final do logger simplificado (apenas console)
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console para todos os ambientes
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
  // Desabilitamos handlers de exceção para simplificar
});

// Métodos simplificados
logger.errorWithContext = (message, error, context = {}) => {
  logger.error(`${message}: ${error.message}`);
};

logger.httpRequest = (req, res, responseTime) => {
  const { method, url } = req;
  const { statusCode } = res;
  
  logger.info(`${method} ${url} - Status: ${statusCode} - Time: ${responseTime}ms`);
};

console.log('[CONFIG] Logger simplificado carregado');

export default logger;