import express from 'express';
import SocialApiController from '../controllers/socialApiController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Instagram
router.get('/instagram/profile', authMiddleware, SocialApiController.getInstagramProfile);
router.get('/instagram/analyze/:username', SocialApiController.analyzeInstagramProfile);

// YouTube
router.get('/youtube/channel', authMiddleware, SocialApiController.getYouTubeChannel);
router.get('/youtube/analyze/:channelIdentifier', SocialApiController.analyzeYouTubeChannel);

// LinkedIn
router.get('/linkedin/profile', authMiddleware, SocialApiController.getLinkedInProfile);
router.get('/linkedin/analyze', authMiddleware, SocialApiController.analyzeLinkedInProfile);

export default router;
