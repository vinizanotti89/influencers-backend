import express from 'express';
import SocialApiController from '../controllers/socialApiController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Instagram
router.get('/instagram/profile', authMiddleware, SocialApiController.getInstagramProfile);
router.get('/instagram/analyze/:username', SocialApiController.analyzeInstagramProfile);

// YouTube
router.get('/youtube/channel', authMiddleware, SocialApiController.getYouTubeChannel);
// Observe: o parâmetro na rota deve corresponder ao parâmetro no controlador
router.get('/youtube/analyze/:channelId', SocialApiController.analyzeYouTubeChannel);

// LinkedIn
router.get('/linkedin/profile', authMiddleware, SocialApiController.getLinkedInProfile);
// Adicionando parâmetro username na rota de análise do LinkedIn
router.get('/linkedin/analyze/:username', authMiddleware, SocialApiController.analyzeLinkedInProfile);

// Adicionando a rota para connections que existe no controlador mas não estava no arquivo de rotas
router.get('/connections', authMiddleware, SocialApiController.getConnections);

export default router;