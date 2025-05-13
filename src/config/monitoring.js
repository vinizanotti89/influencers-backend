import promClient from 'prom-client';
import express from 'express';

// Inicializa o registro do Prometheus
const register = new promClient.Registry();

// Adiciona métricas default do Node.js
promClient.collectDefaultMetrics({
  register,
  prefix: 'influencer_dashboard_'
});

// Métricas personalizadas
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(dbQueryDuration);
register.registerMetric(activeConnections);

// Middleware para monitorar requisições HTTP
export const requestMonitoring = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
};

// Endpoint para métricas do Prometheus
export const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};

// Monitoramento de DB
export const trackDBQuery = (operation, collection, duration) => {
  dbQueryDuration.labels(operation, collection).observe(duration);
};

// Monitoramento de conexões
export const trackConnections = (count) => {
  activeConnections.set(count);
};

export const initializeMonitoring = () => {
  const app = express();
  app.use(requestMonitoring);
  app.get('/metrics', metricsEndpoint);

  return {
    trackDBQuery,
    trackConnections
  };
};

// Single export of httpRequestDuration
export { httpRequestDuration };