import { expect } from 'chai';
import request from 'supertest';
import app from '../app.js';
import Report from '../models/Report.js';

describe('Testes de API de Relatórios', () => {
  beforeEach(async () => {
    await Report.deleteMany({});
  });

  describe('POST /api/reports', () => {
    it('deve criar um novo relatório', async () => {
      const response = await request(app)
        .post('/api/reports')
        .send({
          type: 'influencer',
          filters: { category: 'Nutrição' }
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('_id');
      expect(response.body.type).to.equal('influencer');
    });
  });

  describe('GET /api/reports', () => {
    it('deve listar todos os relatórios', async () => {
      // Criar relatório de teste
      const testReport = await Report.create({
        type: 'monthly',
        data: { total: 100 },
        status: 'completed'
      });

      const response = await request(app).get('/api/reports');

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]._id).to.equal(testReport._id.toString());
    });
  });
});