import express from 'express';
import SocialAuthController from '../controllers/socialAuthController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Instagram
router.get('/instagram/url', SocialAuthController.getInstagramAuthUrl);
router.post('/instagram', SocialAuthController.authenticateInstagram);
router.post('/instagram/disconnect', authMiddleware, SocialAuthController.disconnectInstagram);

// YouTube
router.get('/youtube/url', SocialAuthController.getYouTubeAuthUrl); 
router.post('/youtube', SocialAuthController.authenticateYouTube);
router.post('/youtube/disconnect', authMiddleware, SocialAuthController.disconnectYouTube);

// LinkedIn
router.get('/linkedin/url', SocialAuthController.getLinkedInAuthUrl); 
router.post('/linkedin', SocialAuthController.authenticateLinkedIn);
router.post('/linkedin/disconnect', authMiddleware, SocialAuthController.disconnectLinkedIn);

export default router;