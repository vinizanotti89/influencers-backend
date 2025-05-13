import { InfluencerService } from '../services/influencerService.js';
import logger from '../config/logger.js';

export class InfluencerController {
  /**
   * Recupera todos os influenciadores com opções de filtragem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getAll(req, res) {
    try {
      const filters = {
        search: req.query.search,
        platform: req.query.platform,
        category: req.query.category,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort
      };

      const result = await InfluencerService.search(filters);

      // Adicionar metadados de tendências para o dashboard
      if (req.query.includeTrends === 'true') {
        // Buscar dados históricos para calcular tendências reais
        const trends = await InfluencerService.calculateTrends();
        result.meta = { trends };
      }

      return res.json(result);
    } catch (error) {
      logger.error('Error getting influencers:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
 * Calcula tendências com base em dados históricos
 * @returns {Object} Tendências calculadas
 */
  static async calculateTrends() {
    try {
      // Obter dados históricos
      const currentDate = new Date();
      const lastMonth = new Date(currentDate);
      lastMonth.setMonth(currentDate.getMonth() - 1);

      // Buscar influenciadores atuais
      const currentInfluencers = await Influencer.find({
        updatedAt: { $gte: lastMonth }
      });

      // Calcular métricas
      const followerCounts = currentInfluencers.map(inf => inf.followers || 0);
      const trustScores = currentInfluencers.map(inf => inf.trustScore || 0);

      // Buscar dados históricos de um mês atrás
      const historicalData = await InfluencerHistory.find({
        date: {
          $gte: new Date(lastMonth.setMonth(lastMonth.getMonth() - 1)),
          $lt: lastMonth
        }
      });

      const historicalFollowers = historicalData.map(h => h.followers || 0);
      const historicalTrustScores = historicalData.map(h => h.trustScore || 0);

      // Calcular médias
      const avgCurrentFollowers = followerCounts.length ?
        followerCounts.reduce((sum, count) => sum + count, 0) / followerCounts.length : 0;

      const avgHistoricalFollowers = historicalFollowers.length ?
        historicalFollowers.reduce((sum, count) => sum + count, 0) / historicalFollowers.length : 0;

      const avgCurrentTrustScore = trustScores.length ?
        trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length : 0;

      const avgHistoricalTrustScore = historicalTrustScores.length ?
        historicalTrustScores.reduce((sum, score) => sum + score, 0) / historicalTrustScores.length : 0;

      // Calcular crescimentos percentuais
      const followerGrowth = avgHistoricalFollowers ?
        ((avgCurrentFollowers - avgHistoricalFollowers) / avgHistoricalFollowers) * 100 : 0;

      const trustScoreGrowth = avgHistoricalTrustScore ?
        ((avgCurrentTrustScore - avgHistoricalTrustScore) / avgHistoricalTrustScore) * 100 : 0;

      // Crescimento mensal de influenciadores
      const currentCount = currentInfluencers.length;
      const historicalCount = await Influencer.countDocuments({
        createdAt: {
          $gte: new Date(lastMonth.setMonth(lastMonth.getMonth() - 1)),
          $lt: lastMonth
        }
      });

      const monthlyGrowth = historicalCount ?
        ((currentCount - historicalCount) / historicalCount) * 100 : 0;

      return {
        monthlyGrowth: parseFloat(monthlyGrowth.toFixed(1)),
        followerGrowth: parseFloat(followerGrowth.toFixed(1)),
        trustScoreGrowth: parseFloat(trustScoreGrowth.toFixed(1))
      };
    } catch (error) {
      logger.error('Error calculating trends:', error);
      // Retornar valores zerados em caso de erro
      return {
        monthlyGrowth: 0,
        followerGrowth: 0,
        trustScoreGrowth: 0
      };
    }
  }
  
  /**
   * Recupera um influenciador por ID
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const influencer = await InfluencerService.getById(id);

      if (!influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      return res.json(influencer);
    } catch (error) {
      logger.error(`Error getting influencer ${req.params.id}:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Cria um novo influenciador
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async create(req, res) {
    try {
      const influencerData = req.body;

      if (!influencerData.username || !influencerData.platform) {
        return res.status(400).json({ error: 'Username and platform are required' });
      }

      const existingInfluencer = await InfluencerService.findByUsername(
        influencerData.username,
        influencerData.platform
      );

      if (existingInfluencer) {
        return res.status(409).json({ error: 'Influencer already exists' });
      }

      const newInfluencer = await InfluencerService.create(influencerData);
      return res.status(201).json(newInfluencer);
    } catch (error) {
      logger.error('Error creating influencer:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Atualiza um influenciador existente
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const influencer = await InfluencerService.getById(id);

      if (!influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      const updatedInfluencer = await InfluencerService.update(id, updateData);
      return res.json(updatedInfluencer);
    } catch (error) {
      logger.error(`Error updating influencer ${req.params.id}:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Remove um influenciador
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const influencer = await InfluencerService.getById(id);

      if (!influencer) {
        return res.status(404).json({ error: 'Influencer not found' });
      }

      await InfluencerService.delete(id);
      return res.json({ success: true, message: 'Influencer deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting influencer ${req.params.id}:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Busca influenciadores por nome de usuário e plataforma
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async search(req, res) {
    try {
      const { username, platform } = req.query;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      // Se a plataforma não for especificada, busca em todas
      const actualPlatform = platform || 'all';

      if (actualPlatform !== 'all') {
        // Busca específica em uma plataforma
        const influencer = await InfluencerService.findByUsername(username, actualPlatform);

        if (!influencer) {
          return res.status(404).json({ error: 'Influencer not found' });
        }

        return res.json(influencer);
      } else {
        // Busca em todas as plataformas
        const filters = {
          search: username,
          limit: 5
        };

        const result = await InfluencerService.search(filters);

        if (!result.data || result.data.length === 0) {
          return res.status(404).json({ error: 'No influencers found' });
        }

        return res.json(result.data[0]); // Retorna o primeiro resultado
      }
    } catch (error) {
      logger.error(`Error searching influencer ${req.query.username}:`, error);
      return res.status(500).json({ error: error.message });
    }
  }
}

export default InfluencerController;