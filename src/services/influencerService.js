import { Influencer } from '../models/Influencer.js';

export class InfluencerService {
  static async getAll(filters = {}) {
    const query = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.platform) {
      query.platform = filters.platform;
    }

    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    return await Influencer.find(query).populate('claims');
  }

  static async getById(id) {
    return await Influencer.findById(id).populate('claims');
  }

  static async create(influencerData) {
    const influencer = new Influencer(influencerData);
    return await influencer.save();
  }

  static async update(id, updateData) {
    return await Influencer.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
  }

  static async delete(id) {
    return await Influencer.findByIdAndDelete(id);
  }

  static async findByUsername(username, platform) {
    const query = {
      username: { $regex: username, $options: 'i' },
      platform: platform.toLowerCase()
    };

    return await Influencer.findOne(query);
  }

  // Adicionando um método para busca paginada
  static async search(filters = {}) {
    const { search, platform, category, page = 1, limit = 10 } = filters;

    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (platform && platform !== 'all') {
      query.platform = platform.toLowerCase();
    }

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    const total = await Influencer.countDocuments(query);

    const data = await Influencer.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ followers: -1 });

    return {
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: total > skip + data.length
    };
  }

  /**
   * Calcula tendências de crescimento para influenciadores
   * @param {string} platform - Plataforma para filtrar (opcional)
   * @param {number} timeframe - Período em dias para análise (padrão: 30)
   * @param {number} limit - Número máximo de resultados (padrão: 10)
   * @returns {Promise<Array>} - Lista de influenciadores com métricas de tendência
   */
  static async calculateTrends(platform = null, timeframe = 30, limit = 10) {
    // Definir data de início para o período de análise
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Consulta base
    const query = {
      updatedAt: { $gte: startDate }
    };

    // Adicionar filtro de plataforma se fornecido
    if (platform) {
      query.platform = platform.toLowerCase();
    }

    // Buscar influenciadores com histórico de métricas
    const influencers = await Influencer.find(query)
      .populate({
        path: 'metricHistory',
        match: { createdAt: { $gte: startDate } }
      })
      .limit(parseInt(limit));

    // Calcular tendências para cada influenciador
    const trendsData = influencers.map(influencer => {
      // Garantir que há histórico de métricas suficiente
      if (!influencer.metricHistory || influencer.metricHistory.length < 2) {
        return {
          ...influencer.toObject(),
          followerGrowth: 0,
          engagementChange: 0,
          growthRate: 0
        };
      }

      // Ordenar histórico por data
      const sortedHistory = [...influencer.metricHistory].sort((a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      // Pegar primeiro e último registro para o período
      const firstRecord = sortedHistory[0];
      const lastRecord = sortedHistory[sortedHistory.length - 1];

      // Calcular diferenças
      const followerDiff = lastRecord.followers - firstRecord.followers;
      const engagementDiff = lastRecord.engagement - firstRecord.engagement;

      // Calcular taxas de crescimento
      const daysDiff = (new Date(lastRecord.createdAt) - new Date(firstRecord.createdAt)) / (1000 * 60 * 60 * 24);
      const growthRate = daysDiff > 0 ? (followerDiff / firstRecord.followers) / daysDiff * 100 : 0;

      return {
        ...influencer.toObject(),
        followerGrowth: followerDiff,
        engagementChange: engagementDiff,
        growthRate: parseFloat(growthRate.toFixed(2))
      };
    });

    // Ordenar por taxa de crescimento
    return trendsData.sort((a, b) => b.growthRate - a.growthRate);
  }

  /**
   * Analisa a distribuição de categorias entre influenciadores
   * @param {string} platform - Plataforma para filtrar (opcional)
   * @returns {Promise<Object>} - Contagem de influenciadores por categoria
   */
  static async analyzeCategories(platform = null) {
    const query = {};

    if (platform) {
      query.platform = platform.toLowerCase();
    }

    const aggregation = [
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];

    const results = await Influencer.aggregate(aggregation);

    // Transformar em objeto para fácil acesso
    const categoryCounts = {};
    results.forEach(item => {
      categoryCounts[item._id || 'uncategorized'] = item.count;
    });

    return categoryCounts;
  }
}