import express from 'express';
import { SocialAuthController } from '../controllers/socialAuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Instagram
router.get('/instagram/url', SocialAuthController.getInstagramAuthUrl);
router.post('/instagram', SocialAuthController.authenticateInstagram);
router.post('/instagram/disconnect', authMiddleware, SocialAuthController.disconnectInstagram);

// YouTube
router.get('/youtube/url', SocialAuthController.getYoutubeAuthUrl);
router.post('/youtube', SocialAuthController.authenticateYoutube);
router.post('/youtube/disconnect', authMiddleware, SocialAuthController.disconnectYoutube);

// LinkedIn
router.get('/linkedin/url', SocialAuthController.getLinkedinAuthUrl);
router.post('/linkedin', SocialAuthController.authenticateLinkedin);
router.post('/linkedin/disconnect', authMiddleware, SocialAuthController.disconnectLinkedin);

export default router;