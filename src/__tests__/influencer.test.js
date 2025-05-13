import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { Influencer } from '../models/Influencer.js';

beforeAll(async () => {
  const url = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test';
  await mongoose.connect(url);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Influencer.deleteMany({});
});

describe('Testes de API do Influenciador', () => {
  test('deve criar um novo influenciador', async () => {
    const influencerData = {
      name: 'Teste Influencer',
      platform: 'Instagram',
      followers: 10000,
      trustScore: 85,
      category: 'Nutrição'
    };

    const response = await request(app)
      .post('/api/influencers')
      .send(influencerData);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe(influencerData.name);
    expect(response.body.platform).toBe(influencerData.platform);
  });

  test('deve retornar erro para dados inválidos', async () => {
    const invalidData = {
      name: '',
      platform: 'InvalidPlatform',
      followers: -1
    };

    const response = await request(app)
      .post('/api/influencers')
      .send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });
});