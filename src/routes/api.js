import express from 'express';
import SocialAuthController from '../controllers/socialAuthController.js';
import * as SocialApiController from '../controllers/socialApiController.js';
import ReportController from '../controllers/reportController.js';
import InfluencerController from '../controllers/influencerController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Verificar métodos críticos no início
const verifyMethod = (controller, methodName) => {
  if (!controller[methodName]) {
    console.error(`[FATAL] Method ${methodName} is undefined in controller`);
    controller[methodName] = (req, res) => {
      res.status(500).json({ error: 'Method not implemented' });
    };
  }
  return controller[methodName];
};

// Rotas de Autenticação OAuth para Instagram
router.get('/auth/instagram/url', verifyMethod(SocialAuthController, 'getInstagramAuthUrl'));
router.post('/auth/instagram', authMiddleware.optional, SocialAuthController.authenticateInstagram);
router.delete('/auth/instagram', authMiddleware.required, SocialAuthController.disconnectInstagram);

// Rotas de Autenticação OAuth para YouTube
router.get('/auth/youtube/url', SocialAuthController.getYouTubeAuthUrl);
router.get('/auth/youtube/callback', SocialAuthController.authenticateYouTube);
router.post('/auth/youtube', authMiddleware.optional, SocialAuthController.authenticateYouTube);
router.delete('/auth/youtube', authMiddleware.required, SocialAuthController.disconnectYouTube);

// Rotas de Autenticação OAuth para LinkedIn
router.get('/auth/linkedin/url', SocialAuthController.getLinkedInAuthUrl);
router.get('/auth/linkedin/callback', SocialAuthController.authenticateLinkedIn);
router.post('/auth/linkedin', authMiddleware.optional, SocialAuthController.authenticateLinkedIn);
router.delete('/auth/linkedin', authMiddleware.required, SocialAuthController.disconnectLinkedIn);

// Rotas da API de Redes Sociais
// Rotas protegidas (requerem autenticação)
router.get('/social/instagram/profile', authMiddleware.required, SocialApiController.getInstagramProfile);
router.get('/social/youtube/channel', authMiddleware.required, SocialApiController.getYouTubeChannel);
router.get('/social/linkedin/profile', authMiddleware.required, SocialApiController.getLinkedInProfile);
router.get('/social/connections', authMiddleware.required, SocialApiController.getConnections);

// Rotas públicas (análise de perfis)
router.get('/social/instagram/analyze/:username', SocialApiController.analyzeInstagramProfile);
router.get('/social/youtube/analyze/:channelId', SocialApiController.analyzeYouTubeChannel);
router.get('/social/linkedin/analyze/:username', SocialApiController.analyzeLinkedInProfile);

// Rotas de Influenciadores
router.get('/influencers', InfluencerController.getAll);
router.get('/influencers/:id', InfluencerController.getById);
router.post('/influencers', authMiddleware.required, InfluencerController.create);
router.put('/influencers/:id', authMiddleware.required, InfluencerController.update);
router.delete('/influencers/:id', authMiddleware.required, InfluencerController.delete);
router.get('/influencers/search', InfluencerController.search);

// Rotas de Relatórios (todas protegidas)
router.get('/reports', authMiddleware.required, ReportController.getReports);
router.get('/reports/:id', authMiddleware.required, ReportController.getReportById);
router.post('/reports', authMiddleware.required, ReportController.generateReport);
router.get('/reports/:id/export/:format', authMiddleware.required, ReportController.exportReport);

export default router;