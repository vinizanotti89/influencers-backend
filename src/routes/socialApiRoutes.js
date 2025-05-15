import express from 'express';
// Importando as funções diretamente do controlador
import * as SocialApi from '../controllers/socialApiController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Rota básica para testar
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Instagram
router.get('/instagram/profile', authMiddleware, SocialApi.getInstagramProfile);
router.get('/instagram/analyze/:username', SocialApi.analyzeInstagramProfile);

// YouTube
router.get('/youtube/channel', authMiddleware, SocialApi.getYouTubeChannel);
router.get('/youtube/analyze/:channelId', SocialApi.analyzeYouTubeChannel);

// LinkedIn
router.get('/linkedin/profile', authMiddleware, SocialApi.getLinkedInProfile);
router.get('/linkedin/analyze/:username', authMiddleware, SocialApi.analyzeLinkedInProfile);
router.get('/linkedin/influencer', authMiddleware, SocialApi.analyzeLinkedInInfluencer);

// Conexões
router.get('/connections', authMiddleware, SocialApi.getConnections);

export default router;