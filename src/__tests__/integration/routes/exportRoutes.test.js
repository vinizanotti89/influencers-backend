import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../../../app.js';
import { ExportService } from '../../../services/ExportService.js';

describe('Export Routes Integration Tests', () => {
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

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/export/influencers', () => {
    it('should export influencers data as CSV', async () => {
      const response = await request(app)
        .get('/api/export/influencers?format=csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.header['content-type']).to.include('text/csv');
      expect(response.header['content-disposition']).to.include('attachment');
      expect(response.text).to.include('name,platform,followers,trustScore');
    });

    it('should export influencers data as PDF', async () => {
      const response = await request(app)
        .get('/api/export/influencers?format=pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.header['content-type']).to.include('application/pdf');
      expect(response.header['content-disposition']).to.include('attachment');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/export/influencers?format=csv')
        .expect(401);
    });
  });

  describe('GET /api/export/claims', () => {
    it('should export claims data as CSV', async () => {
      const response = await request(app)
        .get('/api/export/claims?format=csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.header['content-type']).to.include('text/csv');
      expect(response.text).to.include('content,category,status,trustScore');
    });

    it('should apply filters to exported data', async () => {
      const response = await request(app)
        .get('/api/export/claims?format=csv&status=verified&category=nutrition')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.text).to.include('verified');
      expect(response.text).to.include('nutrition');
    });
  });

  describe('GET /api/export/reports', () => {
    it('should generate and export analytics report', async () => {
      const response = await request(app)
        .get('/api/export/reports/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('reportUrl');
      expect(response.body.status).to.equal('success');
    });

    it('should handle invalid report type', async () => {
      await request(app)
        .get('/api/export/reports/invalid-type')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});