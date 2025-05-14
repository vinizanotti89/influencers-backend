import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Define se estamos em produção
const isProd = process.env.NODE_ENV === 'production';

// Diretório de logs apenas em dev
let logDir;
if (!isProd) {
  logDir = path.join('./logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// Formato customizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} ${level.toUpperCase()}: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` - ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Formato colorido para console
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  customFormat
);

// Definição dos níveis e cores (opcional mas legal)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Nível de log baseado no ambiente
const level = () => (isProd ? 'info' : 'debug');

// Transportes básicos (console sempre)
const transports = [
  new winston.transports.Console({
    level: level(),
    format: consoleFormat,
  }),
];

// Adiciona arquivos de log só em dev
if (!isProd) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: 'info',
      format: customFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 10485760,
      maxFiles: 5,
    })
  );
}

// Logger final
const logger = winston.createLogger({
  level: level(),
  levels,
  format: customFormat,
  transports,
  ...(isProd
    ? {}
    : {
        exceptionHandlers: [
          new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log'),
            format: customFormat,
            maxsize: 10485760,
            maxFiles: 5,
          }),
        ],
        rejectionHandlers: [
          new winston.transports.File({
            filename: path.join(logDir, 'rejections.log'),
            format: customFormat,
            maxsize: 10485760,
            maxFiles: 5,
          }),
        ],
      }),
});

// Métodos utilitários
logger.errorWithContext = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
};

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

console.log('[CONFIG] Logger carregado corretamente');

export default logger;
