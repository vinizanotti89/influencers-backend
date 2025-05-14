import axios from 'axios';
import { OAuthService } from '../services/oauthService.js';
import logger from '../config/logger.js';
import { Influencer } from '../models/Influencer.js';

class SocialApiController {
    /**
     * Recupera o perfil do Instagram do usuário autenticado
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async getInstagramProfile(req, res) {
        try {
            // Token de acesso pode vir da requisição ou do usuário autenticado
            const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
            if (!token) {
                return res.status(401).json({ error: 'Token não fornecido' });
            }

            // Faz requisição à API do Instagram
            const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,media_count&access_token=${token.accessToken}`);
            return res.json(response.data);
        } catch (error) {
            logger.error('Instagram profile error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Analisa um perfil do Instagram por nome de usuário
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async analyzeInstagramProfile(req, res) {
        try {
            const { username } = req.params;

            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }

            // Primeiro tenta buscar do banco de dados
            let influencer = await Influencer.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                platform: 'instagram'
            });

            // Se encontrou no banco e os dados são recentes (menos de 24h), retorna diretamente
            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (influencer &&
                influencer.updatedAt &&
                (new Date() - new Date(influencer.updatedAt)) < ONE_DAY) {
                return res.json(influencer);
            }

            // Se não encontrou ou os dados são antigos, busca da API
            // Utiliza o token do sistema para fazer chamadas à API (não do usuário)
            const instagramApiKey = process.env.INSTAGRAM_API_KEY;

            if (!instagramApiKey) {
                return res.status(500).json({ error: 'Instagram API key not configured' });
            }

            // Faz requisição à API externa para analisar o perfil
            const analysisResponse = await axios.get(`https://api.influenceranalytics.com/instagram/profile`, {
                params: { username },
                headers: { 'X-API-KEY': instagramApiKey }
            });

            const profileData = analysisResponse.data;

            // Se o influenciador já existe no banco, atualiza os dados
            if (influencer) {
                influencer.name = profileData.full_name || influencer.name;
                influencer.followers = profileData.followers_count || influencer.followers;
                influencer.engagement = profileData.engagement_rate || influencer.engagement;
                influencer.thumbnailUrl = profileData.profile_picture_url || influencer.thumbnailUrl;
                influencer.postsCount = profileData.media_count || influencer.postsCount;
                influencer.updatedAt = new Date();
                influencer.trustScore = profileData.trust_score || influencer.trustScore;

                await influencer.save();
            } else {
                // Se não existe, cria novo registro
                influencer = await Influencer.create({
                    username: username,
                    name: profileData.full_name || username,
                    platform: 'instagram',
                    followers: profileData.followers_count || 0,
                    engagement: profileData.engagement_rate || 0,
                    thumbnailUrl: profileData.profile_picture_url || '',
                    postsCount: profileData.media_count || 0,
                    trustScore: profileData.trust_score || 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            return res.json(influencer);
        } catch (error) {
            logger.error(`Instagram analysis error for ${req.params.username}:`, error);

            // Se o erro é da API externa, tenta retornar dados básicos
            if (error.response && error.response.status === 404) {
                return res.status(404).json({ error: 'Instagram profile not found' });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Recupera o canal do YouTube do usuário autenticado
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async getYouTubeChannel(req, res) {
        try {
            // Token de acesso pode vir da requisição ou do usuário autenticado
            const token = req.headers.token || (req.user && await OAuthService.getUserToken(req.user.id, 'youtube'));

            if (!token || !token.accessToken) {
                return res.status(401).json({ error: 'YouTube access token not available' });
            }

            // Faz requisição à API do YouTube
            const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics,contentDetails',
                    mine: true
                },
                headers: {
                    Authorization: `Bearer ${token.accessToken}`
                }
            });

            return res.json(response.data);
        } catch (error) {
            logger.error('YouTube channel error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Analisa um canal do YouTube por ID ou nome de usuário
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async analyzeYouTubeChannel(req, res) {
        try {
            const { channelId } = req.params;

            if (!channelId) {
                return res.status(400).json({ error: 'Channel ID or username is required' });
            }

            // Primeiro tenta buscar do banco de dados
            let influencer = await Influencer.findOne({
                $or: [
                    { username: { $regex: new RegExp(`^${channelId}$`, 'i') } },
                    { platformId: channelId }
                ],
                platform: 'youtube'
            });

            // Se encontrou no banco e os dados são recentes (menos de 24h), retorna diretamente
            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (influencer &&
                influencer.updatedAt &&
                (new Date() - new Date(influencer.updatedAt)) < ONE_DAY) {
                return res.json(influencer);
            }

            // Se não encontrou ou os dados são antigos, busca da API
            const youtubeApiKey = process.env.YOUTUBE_API_KEY;

            if (!youtubeApiKey) {
                return res.status(500).json({ error: 'YouTube API key not configured' });
            }

            // Determina se o identificador é um ID ou nome de usuário do canal
            let params = {};

            if (channelId.startsWith('UC')) {
                // Parece ser um ID de canal
                params = {
                    part: 'snippet,statistics,contentDetails,brandingSettings',
                    id: channelId,
                    key: youtubeApiKey
                };
            } else {
                // Assume que é um nome de usuário
                params = {
                    part: 'snippet,statistics,contentDetails,brandingSettings',
                    forUsername: channelId,
                    key: youtubeApiKey
                };
            }

            // Faz requisição à API do YouTube
            let response = await axios.get('https://www.googleapis.com/youtube/v3/channels', { params });

            // Se não encontrou pelo nome de usuário, tenta buscar pelo termo
            if (!response.data.items || response.data.items.length === 0) {
                if (!channelId.startsWith('UC')) {
                    // Busca canais que correspondam ao termo
                    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                        params: {
                            part: 'snippet',
                            q: channelId,
                            type: 'channel',
                            maxResults: 1,
                            key: youtubeApiKey
                        }
                    });

                    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
                        return res.status(404).json({ error: 'YouTube channel not found' });
                    }

                    // Obtém o ID do canal e faz uma nova busca com dados completos
                    const actualChannelId = searchResponse.data.items[0].id.channelId;
                    response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                        params: {
                            part: 'snippet,statistics,contentDetails,brandingSettings',
                            id: actualChannelId,
                            key: youtubeApiKey
                        }
                    });
                } else {
                    return res.status(404).json({ error: 'YouTube channel not found' });
                }
            }

            const channelData = response.data.items[0];

            // Calcular taxa de engajamento
            // Para isso, vamos buscar vídeos recentes
            const uploadsPlaylistId = channelData.contentDetails.relatedPlaylists.uploads;
            const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                params: {
                    part: 'snippet,contentDetails',
                    playlistId: uploadsPlaylistId,
                    maxResults: 10,
                    key: youtubeApiKey
                }
            });

            const videoIds = videosResponse.data.items.map(item => item.contentDetails.videoId);

            // Obter estatísticas dos vídeos
            const videosStatsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'statistics',
                    id: videoIds.join(','),
                    key: youtubeApiKey
                }
            });

            // Calcular engajamento médio
            const videos = videosStatsResponse.data.items || [];
            let totalEngagement = 0;

            videos.forEach(video => {
                if (video.statistics) {
                    const likes = parseInt(video.statistics.likeCount) || 0;
                    const comments = parseInt(video.statistics.commentCount) || 0;
                    totalEngagement += likes + comments;
                }
            });

            const avgEngagement = videos.length > 0 ? totalEngagement / videos.length : 0;
            const subscriberCount = parseInt(channelData.statistics.subscriberCount) || 1;
            const engagementRate = (avgEngagement / subscriberCount) * 100;

            // Preparar dados para salvar/retornar
            const channelInfo = {
                platformId: channelData.id,
                username: channelData.snippet.customUrl || channelData.snippet.title,
                name: channelData.snippet.title,
                platform: 'youtube',
                followers: parseInt(channelData.statistics.subscriberCount) || 0,
                engagement: parseFloat(engagementRate.toFixed(2)) || 0,
                thumbnailUrl: channelData.snippet.thumbnails.default.url || '',
                postsCount: parseInt(channelData.statistics.videoCount) || 0,
                trustScore: SocialApiController.calculateTrustScore(channelData, videos),
                description: channelData.snippet.description,
                bannerUrl: channelData.brandingSettings?.image?.bannerExternalUrl || '',
                country: channelData.snippet.country || '',
                viewCount: parseInt(channelData.statistics.viewCount) || 0,
                updatedAt: new Date()
            };

            // Se o influenciador já existe no banco, atualiza os dados
            if (influencer) {
                Object.assign(influencer, channelInfo);
                await influencer.save();
            } else {
                // Se não existe, cria novo registro
                channelInfo.createdAt = new Date();
                influencer = await Influencer.create(channelInfo);
            }

            return res.json(influencer);
        } catch (error) {
            logger.error(`YouTube analysis error for ${req.params.channelId}:`, error);

            // Se o erro é da API do YouTube, retorna mensagem específica
            if (error.response && error.response.status === 404) {
                return res.status(404).json({ error: 'YouTube channel not found' });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Recupera o perfil do LinkedIn do usuário autenticado
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async getLinkedInProfile(req, res) {
        try {
            // Token de acesso pode vir da requisição ou do usuário autenticado
            const token = req.headers.token || (req.user && await OAuthService.getUserToken(req.user.id, 'linkedin'));

            if (!token || !token.accessToken) {
                return res.status(401).json({ error: 'LinkedIn access token not available' });
            }

            // Faz requisição à API do LinkedIn
            const response = await axios.get('https://api.linkedin.com/v2/me', {
                params: {
                    fields: 'id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams)'
                },
                headers: {
                    Authorization: `Bearer ${token.accessToken}`
                }
            });

            return res.json(response.data);
        } catch (error) {
            logger.error('LinkedIn profile error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Analisa um perfil do LinkedIn por nome de usuário
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async analyzeLinkedInProfile(req, res) {
        try {
            const { username } = req.params;

            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }

            // Primeiro tenta buscar do banco de dados
            let influencer = await Influencer.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                platform: 'linkedin'
            });

            // Se encontrou no banco e os dados são recentes (menos de 24h), retorna diretamente
            const ONE_DAY = 24 * 60 * 60 * 1000;
            if (influencer &&
                influencer.updatedAt &&
                (new Date() - new Date(influencer.updatedAt)) < ONE_DAY) {
                return res.json(influencer);
            }

            // Se não encontrou ou os dados são antigos, busca da API
            const linkedinApiKey = process.env.LINKEDIN_API_KEY;

            if (!linkedinApiKey) {
                return res.status(500).json({ error: 'LinkedIn API key not configured' });
            }

            // Faz requisição à API externa para analisar o perfil
            const analysisResponse = await axios.get(`https://api.influenceranalytics.com/linkedin/profile`, {
                params: { username },
                headers: { 'X-API-KEY': linkedinApiKey }
            });

            const profileData = analysisResponse.data;

            // Preparar dados para salvar/retornar
            const linkedinInfo = {
                username: username,
                name: `${profileData.firstName} ${profileData.lastName}` || username,
                platform: 'linkedin',
                followers: profileData.followers_count || 0,
                engagement: profileData.engagement_rate || 0,
                thumbnailUrl: profileData.profile_picture_url || '',
                postsCount: profileData.posts_count || 0,
                trustScore: profileData.trust_score || 0,
                title: profileData.headline || '',
                industry: profileData.industry || '',
                location: profileData.location || '',
                updatedAt: new Date()
            };

            // Se o influenciador já existe no banco, atualiza os dados
            if (influencer) {
                Object.assign(influencer, linkedinInfo);
                await influencer.save();
            } else {
                // Se não existe, cria novo registro
                linkedinInfo.createdAt = new Date();
                influencer = await Influencer.create(linkedinInfo);
            }

            return res.json(influencer);
        } catch (error) {
            logger.error(`LinkedIn analysis error for ${req.params.username}:`, error);

            // Se o erro é da API externa, tenta retornar dados básicos
            if (error.response && error.response.status === 404) {
                return res.status(404).json({ error: 'LinkedIn profile not found' });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Calcula uma pontuação de confiabilidade para um canal do YouTube
     * @param {Object} channelData - Dados do canal
     * @param {Array} videos - Lista de vídeos recentes
     * @returns {number} Pontuação de confiabilidade (0-100)
     */
    static calculateTrustScore(channelData, videos) {
        try {
            let score = 50; // Começa com pontuação média

            // Idade do canal (canais mais antigos são mais confiáveis)
            const channelAge = new Date() - new Date(channelData.snippet.publishedAt);
            const ageInYears = channelAge / (1000 * 60 * 60 * 24 * 365);
            score += Math.min(ageInYears * 5, 20); // Até 20 pontos pela idade

            // Número de inscritos
            const subscriberCount = parseInt(channelData.statistics.subscriberCount) || 0;
            if (subscriberCount > 1000000) {
                score += 15;
            } else if (subscriberCount > 100000) {
                score += 10;
            } else if (subscriberCount > 10000) {
                score += 5;
            }

            // Número de vídeos
            const videoCount = parseInt(channelData.statistics.videoCount) || 0;
            if (videoCount > 100) {
                score += 10;
            } else if (videoCount > 50) {
                score += 5;
            } else if (videoCount > 20) {
                score += 3;
            }

            // Verificação do canal
            if (channelData.status && channelData.status.isVerified) {
                score += 15;
            }

            // Limitar score entre 0 e 100
            return Math.min(Math.max(Math.round(score), 0), 100);
        } catch (error) {
            logger.error('Error calculating trust score:', error);
            return 50; // Retorna pontuação média em caso de erro
        }
    }

    /**
     * Recupera dados de conexão das redes sociais do usuário autenticado
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    static async getConnections(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const connections = await OAuthService.getUserConnections(req.user.id);
            return res.json(connections);
        } catch (error) {
            logger.error('Get connections error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

export default SocialApiController;