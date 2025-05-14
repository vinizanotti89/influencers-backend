import axios from 'axios';
import { OAuthService } from '../services/oauthService.js';
import logger from '../config/logger.js';

class SocialAuthController {

  static async getInstagramAuthUrl(_req, res) {
    try {
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
      return res.json({ url: authUrl });
    } catch (error) {
      logger.error('Error generating Instagram auth URL:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async authenticateInstagram(req, res) {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Authorization code is required' });

      const response = await axios.post('https://api.instagram.com/oauth/access_token',
        new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token, user_id } = response.data;
      if (req.user) {
        await OAuthService.saveUserToken(req.user.id, 'instagram', access_token, user_id);
      }

      return res.json({
        accessToken: access_token,
        userId: user_id,
        expiresIn: 60 * 60 * 24 * 60 // 60 dias em segundos
      });
    } catch (error) {
      logger.error('Error authenticating with Instagram:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async disconnectInstagram(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const token = await OAuthService.getUserToken(req.user.id, 'instagram');
      if (token && token.accessToken) {
        try {
          await axios.delete(`https://graph.instagram.com/access_token?access_token=${token.accessToken}`);
        } catch (revokeError) {
          logger.warn('Error revoking Instagram token:', revokeError);
        }
      }
      await OAuthService.removeUserToken(req.user.id, 'instagram');
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error disconnecting from Instagram:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Gera URL de autenticação para Instagram
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getYouTubeAuthUrl(_req, res) {
    try {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${process.env.YOUTUBE_REDIRECT_URI}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline&prompt=consent`;
      return res.json({ url: authUrl });
    } catch (error) {
      logger.error('Error generating YouTube auth URL:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Troca o código de autorização do Instagram por um token de acesso
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async authenticateYouTube(req, res) {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Authorization code is required' });

      const response = await axios.post('https://oauth2.googleapis.com/token',
        {
          client_id: process.env.YOUTUBE_CLIENT_ID,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.YOUTUBE_REDIRECT_URI
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      let userId = null;
      try {
        const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'id', mine: true },
          headers: { Authorization: `Bearer ${access_token}` }
        });

        if (channelResponse.data.items && channelResponse.data.items.length > 0) {
          userId = channelResponse.data.items[0].id;
        }
      } catch (channelError) {
        logger.warn('Error fetching YouTube channel ID:', channelError);
      }

      if (req.user) {
        await OAuthService.saveUserToken(req.user.id, 'youtube', access_token, userId, refresh_token, expires_in);
      }

      return res.json({
        accessToken: access_token,
        refreshToken: refresh_token,
        userId,
        expiresIn: expires_in
      });
    } catch (error) {
      logger.error('Error authenticating with YouTube:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Revoga o token de acesso do Instagram
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async disconnectYouTube(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const token = await OAuthService.getUserToken(req.user.id, 'youtube');
      if (token && token.accessToken) {
        try {
          await axios.post(`https://oauth2.googleapis.com/revoke?token=${token.accessToken}`, {}, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        } catch (revokeError) {
          logger.warn('Error revoking YouTube token:', revokeError);
        }
      }

      await OAuthService.removeUserToken(req.user.id, 'youtube');
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error disconnecting from YouTube:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Renovar token do YouTube usando refresh token
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async refreshYouTubeToken(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const token = await OAuthService.getUserToken(req.user.id, 'youtube');
      if (!token || !token.refreshToken) return res.status(400).json({ error: 'Refresh token not available' });

      const response = await axios.post('https://oauth2.googleapis.com/token',
        {
          client_id: process.env.YOUTUBE_CLIENT_ID,
          client_secret: process.env.YOUTUBE_CLIENT_SECRET,
          refresh_token: token.refreshToken,
          grant_type: 'refresh_token'
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { access_token, expires_in } = response.data;
      await OAuthService.updateAccessToken(req.user.id, 'youtube', access_token, expires_in);

      return res.json({
        accessToken: access_token,
        expiresIn: expires_in
      });
    } catch (error) {
      logger.error('Error refreshing YouTube token:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Gera URL de autenticação para o LinkedIn
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getLinkedInAuthUrl(_req, res) {
    try {
      const state = Math.random().toString(36).substring(2);
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&state=${state}&scope=r_liteprofile%20r_emailaddress`;
      return res.json({ url: authUrl });
    } catch (error) {
      logger.error('Error generating LinkedIn auth URL:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Troca o código de autorização do LinkedIn por um token de acesso
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async authenticateLinkedIn(req, res) {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: 'Authorization code is required' });

      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const { access_token, expires_in } = response.data;
      let userId = null;
      try {
        const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        });

        userId = profileResponse.data.id;
      } catch (profileError) {
        logger.warn('Error fetching LinkedIn profile ID:', profileError);
      }

      if (req.user) {
        await OAuthService.saveUserToken(req.user.id, 'linkedin', access_token, userId, null, expires_in);
      }

      return res.json({
        accessToken: access_token,
        userId,
        expiresIn: expires_in
      });
    } catch (error) {
      logger.error('Error authenticating with LinkedIn:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Revoga o token de acesso do LinkedIn
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async disconnectLinkedIn(req, res) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const token = await OAuthService.getUserToken(req.user.id, 'linkedin');
      if (token && token.accessToken) {
        try {
          await axios.post(`https://www.linkedin.com/oauth/v2/revoke`, null, {
            params: { access_token: token.accessToken }
          });
        } catch (revokeError) {
          logger.warn('Error revoking LinkedIn token:', revokeError);
        }
      }

      await OAuthService.removeUserToken(req.user.id, 'linkedin');
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error disconnecting from LinkedIn:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async analyzeLinkedInInfluencer(req, res) {
    try {
      const { userId } = req.params;
      const token = await OAuthService.getUserToken(req.user.id, 'linkedin');

      if (!token || !token.accessToken) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const response = await axios.get(`https://api.linkedin.com/v2/people/${userId}`, {
        headers: { Authorization: `Bearer ${token.accessToken}` }
      });

      // Analyze influencer data here (example: return profile information)
      return res.json(response.data);
    } catch (error) {
      logger.error('Error analyzing LinkedIn influencer:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

export default SocialAuthController;