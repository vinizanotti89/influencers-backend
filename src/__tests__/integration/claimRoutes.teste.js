import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../app.js';
import Claim from '../models/Claim.js';
import mongoose from 'mongoose';

describe('Claim Routes Integration Tests', () => {
  let apiKey;
  let testClaimId;

  before(async () => {
    // Configurar ambiente de teste
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    apiKey = process.env.TEST_API_KEY;
  });

  beforeEach(async () => {
    // Criar claim de teste
    const testClaim = new Claim({
      content: 'Test claim',
      influencer: new mongoose.Types.ObjectId(),
      category: 'nutrition',
      status: 'pending',
      trustScore: 80
    });
    const savedClaim = await testClaim.save();
    testClaimId = savedClaim._id;
  });

  afterEach(async () => {
    // Limpar dados de teste
    await Claim.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
  });

  // Teste GET /claims
  describe('GET /api/claims', () => {
    it('should return all claims', async () => {
      const res = await request(app)
        .get('/api/claims')
        .set('X-API-Key', apiKey);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(1);
    });

    it('should fail without API key', async () => {
      const res = await request(app)
        .get('/api/claims');

      expect(res.status).to.equal(401);
    });
  });

  // Teste POST /claims
  describe('POST /api/claims', () => {
    it('should create a new claim', async () => {
      const newClaim = {
        content: 'New test claim',
        influencer: new mongoose.Types.ObjectId(),
        category: 'nutrition',
        status: 'pending',
        trustScore: 85
      };

      const res = await request(app)
        .post('/api/claims')
        .set('X-API-Key', apiKey)
        .send(newClaim);

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('_id');
      expect(res.body.content).to.equal(newClaim.content);
    });
  });

  // Teste GET /claims/:id
  describe('GET /api/claims/:id', () => {
    it('should return claim by id', async () => {
      const res = await request(app)
        .get(`/api/claims/${testClaimId}`)
        .set('X-API-Key', apiKey);

      expect(res.status).to.equal(200);
      expect(res.body._id).to.equal(testClaimId.toString());
    });

    it('should return 404 for non-existent claim', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/claims/${fakeId}`)
        .set('X-API-Key', apiKey);

      expect(res.status).to.equal(404);
    });
  });
});