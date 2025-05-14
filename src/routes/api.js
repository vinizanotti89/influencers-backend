import express from 'express';
import { SocialAuthController } from '../controllers/socialAuthController.js';
import { SocialApiController } from '../controllers/socialApiController.js';
import { ReportController } from '../controllers/reportController.js';
import { InfluencerController } from '../controllers/influencerController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Rotas de Autenticação OAuth
router.get('/auth/instagram/url', SocialAuthController.getInstagramAuthUrl);
router.get('/auth/instagram/callback', SocialAuthController.authenticateInstagram);
router.post('/auth/instagram', authMiddleware.optional, SocialAuthController.authenticateInstagram); // Endpoint para frontend
router.delete('/auth/instagram', authMiddleware.required, SocialAuthController.disconnectInstagram);

router.get('/auth/youtube/url', SocialAuthController.getYouTubeAuthUrl);
router.get('/auth/youtube/callback', SocialAuthController.authenticateYouTube);
router.post('/auth/youtube', authMiddleware.optional, SocialAuthController.authenticateYouTube);// Endpoint para frontend
router.delete('/auth/youtube', authMiddleware.required, SocialAuthController.disconnectYouTube);

router.get('/auth/linkedin/url', SocialAuthController.getLinkedInAuthUrl);
router.get('/auth/linkedin/callback', SocialAuthController.authenticateLinkedIn);
router.post('/auth/linkedin', authMiddleware.optional, SocialAuthController.authenticateLinkedIn); // Endpoint para frontend
router.delete('/auth/linkedin', authMiddleware.required, SocialAuthController.disconnectLinkedIn);

// Status de conexão das redes sociais
// router.get('/auth/connections', authMiddleware.required, SocialAuthController.getConnectionStatus);

// Rotas da API de Redes Sociais
router.get('/social/instagram/profile', SocialApiController.getInstagramProfile);
router.get('/social/instagram/analyze/:username', SocialApiController.analyzeInstagramProfile);

router.get('/social/youtube/channel', SocialApiController.getYouTubeChannel);
router.get('/social/youtube/analyze/:channelId', SocialApiController.analyzeYouTubeChannel);

router.get('/social/linkedin/profile', SocialApiController.getLinkedInProfile);
router.get('/social/linkedin/analyze/:username', SocialApiController.analyzeLinkedInProfile);

router.get('/social/connections', authMiddleware.required, SocialApiController.getConnections);

// Rotas de Influenciadores
router.get('/influencers', InfluencerController.getAll);
router.get('/influencers/:id', InfluencerController.getById);
router.post('/influencers', authMiddleware.required, InfluencerController.create);
router.put('/influencers/:id', authMiddleware.required, InfluencerController.update);
router.delete('/influencers/:id', authMiddleware.required, InfluencerController.delete);
router.get('/influencers/search', InfluencerController.search);

// Rotas de Relatórios
router.get('/reports', authMiddleware.required, ReportController.getReports);
router.get('/reports/:id', authMiddleware.required, ReportController.getReportById);
router.post('/reports', authMiddleware.required, ReportController.generateReport);
router.get('/reports/:id/export/:format', authMiddleware.required, ReportController.exportReport);

export default router;