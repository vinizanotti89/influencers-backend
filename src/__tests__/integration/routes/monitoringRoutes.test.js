import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../../../app.js';
import { client as promClient } from 'prom-client';

describe('Monitoring Routes Integration Tests', () => {
  let authToken;

  before(async () => {
    // Login como admin para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
    authToken = loginResponse.body.token;
  });

  beforeEach(() => {
    // Reset métricas do Prometheus
    promClient.register.clear();
  });

  describe('GET /metrics', () => {
    it('should return prometheus metrics when authenticated', async () => {
      const response = await request(app)
        .get('/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.text).to.include('# HELP');
      expect(response.text).to.include('# TYPE');
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .get('/metrics')
        .expect(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).to.have.property('status', 'ok');
      expect(response.body).to.have.property('uptime');
      expect(response.body).to.have.property('timestamp');
    });

    it('should include database status when authenticated as admin', async () => {
      const response = await request(app)
        .get('/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('database');
      expect(response.body.database).to.have.property('status');
      expect(response.body.database).to.have.property('latency');
    });
  });

  describe('GET /api/monitoring/logs', () => {
    it('should return recent logs when authenticated as admin', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('timestamp');
      expect(response.body[0]).to.have.property('level');
      expect(response.body[0]).to.have.property('message');
    });

    it('should allow filtering logs by level', async () => {
      const response = await request(app)
        .get('/api/monitoring/logs?level=error')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.be.an('array');
      response.body.forEach(log => {
        expect(log.level).to.equal('error');
      });
    });
  });
});