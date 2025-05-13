import { expect } from 'chai';
import mongoose from 'mongoose';
import User from '../../../models/User.js';

describe('User Model Test', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it('should create a user successfully', async () => {
    const validUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@123',
      role: 'user'
    };

    const user = new User(validUser);
    const savedUser = await user.save();
    
    expect(savedUser._id).to.exist;
    expect(savedUser.email).to.equal(validUser.email);
    expect(savedUser.password).to.not.equal(validUser.password); // Should be hashed
  });

  it('should fail to create user without required fields', async () => {
    const user = new User({});

    try {
      await user.save();
      expect.fail('Should throw validation error');
    } catch (error) {
      expect(error.errors.username).to.exist;
      expect(error.errors.email).to.exist;
      expect(error.errors.password).to.exist;
    }
  });

  it('should validate email format', async () => {
    const userWithInvalidEmail = new User({
      username: 'testuser',
      email: 'invalid-email',
      password: 'Test@123',
      role: 'user'
    });

    try {
      await userWithInvalidEmail.save();
      expect.fail('Should throw validation error');
    } catch (error) {
      expect(error.errors.email).to.exist;
    }
  });

  it('should hash password before saving', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@123',
      role: 'user'
    });

    await user.save();
    expect(user.password).to.not.equal('Test@123');
    expect(user.password).to.have.length.greaterThan(20);
  });
});