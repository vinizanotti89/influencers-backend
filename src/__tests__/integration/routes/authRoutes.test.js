import request from 'supertest';
import { expect } from 'chai';
import app from '../../../app.js';
import User from '../../../models/User.js';
import mongoose from 'mongoose';

describe('Auth Routes Integration Tests', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123'
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', userData.email);
      expect(res.body.user).to.not.have.property('password');
    });

    it('should fail registration with existing email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123'
      };

      await User.create(userData);

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body).to.have.property('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123'
      };
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test@123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', loginData.email);
    });

    it('should fail login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });
});