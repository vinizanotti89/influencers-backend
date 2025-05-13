import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
import Claim from '../models/Claim.js';

describe('Claim Model Test', () => {
  // Antes de todos os testes
  before(async () => {
    // Conectar ao MongoDB de teste
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  // Após cada teste
  afterEach(async () => {
    // Limpar a coleção de claims
    await Claim.deleteMany({});
  });

  // Após todos os testes
  after(async () => {
    // Desconectar do MongoDB
    await mongoose.disconnect();
  });

  // Teste de criação de claim
  it('should create a new claim successfully', async () => {
    const validClaim = {
      content: 'Test claim content',
      influencer: new mongoose.Types.ObjectId(),
      category: 'nutrition',
      status: 'pending',
      trustScore: 75
    };

    const claim = new Claim(validClaim);
    const savedClaim = await claim.save();
    
    expect(savedClaim._id).to.exist;
    expect(savedClaim.content).to.equal(validClaim.content);
    expect(savedClaim.category).to.equal(validClaim.category);
  });

  // Teste de validação obrigatória
  it('should fail to create claim without required fields', async () => {
    const claim = new Claim({});

    try {
      await claim.save();
    } catch (error) {
      expect(error).to.exist;
      expect(error.errors.content).to.exist;
      expect(error.errors.influencer).to.exist;
    }
  });

  // Teste de validação de trustScore
  it('should validate trustScore range', async () => {
    const claim = new Claim({
      content: 'Test content',
      influencer: new mongoose.Types.ObjectId(),
      category: 'nutrition',
      status: 'pending',
      trustScore: 150 // Inválido, deve ser entre 0 e 100
    });

    try {
      await claim.save();
    } catch (error) {
      expect(error).to.exist;
      expect(error.errors.trustScore).to.exist;
    }
  });
});