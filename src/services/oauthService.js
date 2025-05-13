// server/src/services/oauthService.js
import axios from 'axios';
import mongoose from 'mongoose';
import logger from '../config/logger.js';

// Modelo de usuário para armazenar tokens OAuth
// Considere mover para um arquivo separado em models/
const UserTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    platform: { type: String, required: true, enum: ['instagram', 'youtube', 'linkedin'] },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    metadata: { type: Object },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Criar índice composto para busca eficiente
UserTokenSchema.index({ userId: 1, platform: 1 }, { unique: true });

// Definir o modelo se ainda não existir
let UserToken;
try {
    UserToken = mongoose.model('UserToken');
} catch (error) {
    UserToken = mongoose.model('UserToken', UserTokenSchema);
}

export class OAuthService {
    /**
     * Gera URL para autenticação com Instagram
     * @returns {string} URL para iniciar o fluxo OAuth
     */
    static async generateInstagramAuthUrl() {
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            throw new Error('Instagram OAuth configuration is missing');
        }

        const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
        return authUrl;
    }

    /**
     * Troca o código de autorização por um token de acesso do Instagram
     * @param {string} code - Código de autorização
     * @returns {Object} Dados do token
     */
    static async exchangeInstagramCode(code) {
        try {
            const clientId = process.env.INSTAGRAM_CLIENT_ID;
            const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
            const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                throw new Error('Instagram OAuth configuration is missing');
            }

            // Solicitar token de acesso
            const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token',
                new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                    code
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, user_id } = tokenResponse.data;

            // Obter informações detalhadas do token (como duração)
            const longLivedTokenResponse = await axios.get(
                `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${access_token}`
            );

            // Calcular data de expiração
            const expiresIn = longLivedTokenResponse.data.expires_in || 5184000; // 60 dias em segundos (padrão)
            const expiresAt = new Date(Date.now() + expiresIn * 1000);

            return {
                accessToken: longLivedTokenResponse.data.access_token || access_token,
                userId: user_id,
                expiresAt,
                expiresIn
            };
        } catch (error) {
            logger.error('Error exchanging Instagram code:', error);
            throw new Error(`Failed to exchange Instagram code: ${error.message}`);
        }
    }

    /**
     * Gera URL para autenticação com YouTube
     * @returns {string} URL para iniciar o fluxo OAuth
     */
    static async generateYouTubeAuthUrl() {
        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            throw new Error('YouTube OAuth configuration is missing');
        }

        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&prompt=consent`;
        return authUrl;
    }

    /**
     * Troca o código de autorização por um token de acesso do YouTube (Google)
     * @param {string} code - Código de autorização
     * @returns {Object} Dados do token
     */
    static async exchangeYouTubeCode(code) {
        try {
            const clientId = process.env.YOUTUBE_CLIENT_ID;
            const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
            const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                throw new Error('YouTube OAuth configuration is missing');
            }

            // Solicitar token de acesso
            const tokenResponse = await axios.post('https://oauth2.googleapis.com/token',
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const { access_token, refresh_token, expires_in } = tokenResponse.data;
            const expiresAt = new Date(Date.now() + expires_in * 1000);

            // Buscar informações do canal
            const channelResponse = await axios.get(
                'https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true',
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                }
            );

            const channelId = channelResponse.data.items[0]?.id;
            const channelTitle = channelResponse.data.items[0]?.snippet?.title;

            return {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt,
                expiresIn: expires_in,
                metadata: {
                    channelId,
                    channelTitle
                }
            };
        } catch (error) {
            logger.error('Error exchanging YouTube code:', error);
            throw new Error(`Failed to exchange YouTube code: ${error.message}`);
        }
    }

    /**
     * Gera URL para autenticação com LinkedIn
     * @returns {string} URL para iniciar o fluxo OAuth
     */
    static async generateLinkedInAuthUrl() {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            throw new Error('LinkedIn OAuth configuration is missing');
        }

        const state = Math.random().toString(36).substring(2);
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;
        return authUrl;
    }

    /**
     * Troca o código de autorização por um token de acesso do LinkedIn
     * @param {string} code - Código de autorização
     * @returns {Object} Dados do token
     */
    static async exchangeLinkedInCode(code) {
        try {
            const clientId = process.env.LINKEDIN_CLIENT_ID;
            const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
            const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                throw new Error('LinkedIn OAuth configuration is missing');
            }

            // Solicitar token de acesso
            const tokenResponse = await axios.post(
                'https://www.linkedin.com/oauth/v2/accessToken',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, expires_in } = tokenResponse.data;
            const expiresAt = new Date(Date.now() + expires_in * 1000);

            // Buscar informações do perfil
            const profileResponse = await axios.get(
                'https://api.linkedin.com/v2/me',
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                }
            );

            const userId = profileResponse.data.id;
            const firstName = profileResponse.data.localizedFirstName;
            const lastName = profileResponse.data.localizedLastName;

            return {
                accessToken: access_token,
                expiresAt,
                expiresIn: expires_in,
                metadata: {
                    userId,
                    firstName,
                    lastName
                }
            };
        } catch (error) {
            logger.error('Error exchanging LinkedIn code:', error);
            throw new Error(`Failed to exchange LinkedIn code: ${error.message}`);
        }
    }

    /**
     * Salva ou atualiza o token de um usuário para uma plataforma
     * @param {string} userId - ID do usuário
     * @param {string} platform - Plataforma ('instagram', 'youtube', 'linkedin')
     * @param {Object} tokenData - Dados do token
     */
    static async saveUserToken(userId, platform, tokenData) {
        try {
            const { accessToken, refreshToken, expiresAt, metadata } = tokenData;

            // Atualizar token se já existir, ou criar novo
            await UserToken.updateOne(
                { userId, platform },
                {
                    accessToken,
                    refreshToken,
                    expiresAt,
                    metadata,
                    updatedAt: new Date()
                },
                { upsert: true }
            );

            return true;
        } catch (error) {
            logger.error(`Error saving ${platform} token for user ${userId}:`, error);
            throw new Error(`Failed to save user token: ${error.message}`);
        }
    }

    /**
     * Remove o token de um usuário para uma plataforma
     * @param {string} userId - ID do usuário
     * @param {string} platform - Plataforma ('instagram', 'youtube', 'linkedin')
     */
    static async removeUserToken(userId, platform) {
        try {
            await UserToken.deleteOne({ userId, platform });
            return true;
        } catch (error) {
            logger.error(`Error removing ${platform} token for user ${userId}:`, error);
            throw new Error(`Failed to remove user token: ${error.message}`);
        }
    }

    /**
     * Obtém o token de acesso de um usuário para uma plataforma
     * @param {string} userId - ID do usuário
     * @param {string} platform - Plataforma ('instagram', 'youtube', 'linkedin')
     * @returns {Object|null} Dados do token ou null se não existir
     */
    static async getUserToken(userId, platform) {
        try {
            const tokenDoc = await UserToken.findOne({ userId, platform });

            if (!tokenDoc) {
                return null;
            }

            // Verificar se o token expirou
            if (tokenDoc.expiresAt && tokenDoc.expiresAt < new Date()) {
                // Para YouTube, tenta renovar o token
                if (platform === 'youtube' && tokenDoc.refreshToken) {
                    try {
                        const newTokenData = await this.refreshYouTubeToken(tokenDoc.refreshToken);
                        await this.saveUserToken(userId, platform, newTokenData);
                        return newTokenData;
                    } catch (refreshError) {
                        logger.error('Error refreshing token:', refreshError);
                        // Se falhar o refresh, remove o token expirado
                        await this.removeUserToken(userId, platform);
                        return null;
                    }
                } else {
                    // Para outros serviços, remove o token expirado
                    await this.removeUserToken(userId, platform);
                    return null;
                }
            }

            return {
                accessToken: tokenDoc.accessToken,
                refreshToken: tokenDoc.refreshToken,
                expiresAt: tokenDoc.expiresAt,
                metadata: tokenDoc.metadata
            };
        } catch (error) {
            logger.error(`Error getting ${platform} token for user ${userId}:`, error);
            throw new Error(`Failed to get user token: ${error.message}`);
        }
    }

    /**
     * Renova um token do YouTube (Google) usando o refresh token
     * @param {string} refreshToken - Token de atualização
     * @returns {Object} Novos dados do token
     */
    static async refreshYouTubeToken(refreshToken) {
        try {
            const clientId = process.env.YOUTUBE_CLIENT_ID;
            const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
                throw new Error('YouTube OAuth configuration is missing');
            }

            const response = await axios.post(
                'https://oauth2.googleapis.com/token',
                {
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                }
            );

            const { access_token, expires_in } = response.data;
            const expiresAt = new Date(Date.now() + expires_in * 1000);

            return {
                accessToken: access_token,
                refreshToken, // Mantém o mesmo refresh token
                expiresAt,
                expiresIn: expires_in
            };
        } catch (error) {
            logger.error('Error refreshing YouTube token:', error);
            throw new Error(`Failed to refresh token: ${error.message}`);
        }
    }

    /**
     * Verifica o status de conexão das contas de um usuário
     * @param {string} userId - ID do usuário
     * @returns {Object} Status de conexão para cada plataforma
     */
    static async getUserConnections(userId) {
        try {
            const tokens = await UserToken.find({ userId });

            // Inicializa com todas as plataformas desconectadas
            const connections = {
                instagram: false,
                youtube: false,
                linkedin: false
            };

            // Marca plataformas conectadas
            tokens.forEach(token => {
                // Apenas considera tokens válidos
                if (!token.expiresAt || token.expiresAt > new Date()) {
                    connections[token.platform] = true;
                }
            });

            return connections;
        } catch (error) {
            logger.error(`Error getting connections for user ${userId}:`, error);
            throw new Error(`Failed to get user connections: ${error.message}`);
        }
    }
}

export default OAuthService;