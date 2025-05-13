import { ClaimModel } from '../models/Claim.js';
import logger from '../config/logger.js';
import redisClient from '../config/redis.js';

export class ClaimService {
  static async getAll(filters = {}) {
    try {
      const cacheKey = `claims:${JSON.stringify(filters)}`;
      const cachedClaims = await redisClient.get(cacheKey);

      if (cachedClaims) {
        return JSON.parse(cachedClaims);
      }

      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.influencerId) {
        query.influencerId = filters.influencerId;
      }

      const claims = await ClaimModel.find(query);

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(claims));

      return claims;
    } catch (error) {
      logger.error('Erro ao buscar alegações:', error);
      throw new Error('Erro ao buscar alegações');
    }
  }

  static async getById(id) {
    try {
      const cacheKey = `claim:${id}`;
      const cachedClaim = await redisClient.get(cacheKey);

      if (cachedClaim) {
        return JSON.parse(cachedClaim);
      }

      const claim = await ClaimModel.findById(id);

      if (claim) {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(claim));
      }

      return claim;
    } catch (error) {
      logger.error(`Erro ao buscar alegação ${id}:`, error);
      throw new Error('Erro ao buscar alegação');
    }
  }

  static async create(claimData) {
    try {
      const newClaim = new ClaimModel({
        ...claimData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedClaim = await newClaim.save();

      await redisClient.del('claims:{}');

      return savedClaim;
    } catch (error) {
      logger.error('Erro ao criar alegação:', error);
      throw new Error('Erro ao criar alegação');
    }
  }

  static async update(id, updateData) {
    try {
      const updatedClaim = await ClaimModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (updatedClaim) {
        const cacheKey = `claim:${id}`;
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(updatedClaim));
        await redisClient.del('claims:{}');
      }

      return updatedClaim;
    } catch (error) {
      logger.error(`Erro ao atualizar alegação ${id}:`, error);
      throw new Error('Erro ao atualizar alegação');
    }
  }

  static async delete(id) {
    try {
      await ClaimModel.findByIdAndDelete(id);

      await redisClient.del(`claim:${id}`);
      await redisClient.del('claims:{}');

      return true;
    } catch (error) {
      logger.error(`Erro ao deletar alegação ${id}:`, error);
      throw new Error('Erro ao deletar alegação');
    }
  }
}