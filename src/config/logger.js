import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Cria o diretório de logs se não existir
const logDir = path.join('/tmp', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuração de formato customizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} ${level.toUpperCase()}: ${message}`;

    // Adiciona metadados se existirem
    if (Object.keys(meta).length > 0) {
      log += ` - ${JSON.stringify(meta)}`;
    }

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

// Níveis de log customizados com cores
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Adicionar cores ao winston
winston.addColors(colors);

// Determinar nível de log baseado no ambiente
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Configuração dos transportes
const transports = [
  // Console para todos os ambientes
  new winston.transports.Console({
    level: level(),
    format: consoleFormat,
  }),

  // Arquivo para todos os logs (info e acima)
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    level: 'info',
    format: customFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),

  // Arquivo separado apenas para erros
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Configuração final do logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: customFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: customFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Adiciona método para registrar erros com contexto
logger.errorWithContext = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

// Adiciona método para registrar requisições HTTP
logger.httpRequest = (req, res, responseTime) => {
  const { method, url, ip, headers } = req;
  const { statusCode } = res;

  logger.http(`${method} ${url}`, {
    ip,
    statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: headers['user-agent'],
    referrer: headers.referer || headers.referrer,
  });
};

// Exporta o logger configurado
export default logger;