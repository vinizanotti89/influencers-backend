import request from 'supertest';
import { expect } from 'chai';
import app from '../../../../app.js';
import User from '../../../../models/User.js';
import mongoose from 'mongoose';

describe('User Flow E2E Tests', () => {
  let userToken;
  let userId;

  before(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  after(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  describe('User Registration and Authentication Flow', () => {
    it('should complete the registration process', async () => {
      const userData = {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'Test@123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', userData.email);
      
      userToken = response.body.token;
      userId = response.body.user._id;
    });

    it('should login successfully', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'Test@123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).to.have.property('token');
    });
  });

  describe('User Profile Management Flow', () => {
    it('should update user profile', async () => {
      const updateData = {
        username: 'updateduser',
        preferences: {
          notifications: true,
          language: 'pt-BR'
        }
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.username).to.equal(updateData.username);
      expect(response.body.preferences.language).to.equal(updateData.preferences.language);
    });

    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/users/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.be.an('array');
    });
  });

  describe('Influencer Search and View Flow', () => {
    it('should search for influencers', async () => {
      const response = await request(app)
        .get('/api/influencers/search?query=nutrition')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('name');
      expect(response.body[0]).to.have.property('category');
    });

    it('should view influencer details', async () => {
      // Assuming we have an influencer ID from the previous search
      const influencerId = response.body[0]._id;

      const response = await request(app)
        .get(`/api/influencers/${influencerId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('trustScore');
    });
  });

  describe('Claims Interaction Flow', () => {
    it('should view claims list', async () => {
      const response = await request(app)
        .get('/api/claims')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('content');
    });

    it('should filter claims by category', async () => {
      const response = await request(app)
        .get('/api/claims?category=nutrition')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).to.be.an('array');
      response.body.forEach(claim => {
        expect(claim.category).to.equal('nutrition');
      });
    });
  });
});