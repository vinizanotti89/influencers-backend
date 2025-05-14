import express from 'express';
import SocialApiController from '../controllers/socialApiController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Instagram
router.get('/instagram/profile', authMiddleware, SocialApiController.getInstagramProfile);
router.get('/instagram/analyze/:username', SocialApiController.analyzeInstagramInfluencer);

// YouTube
router.get('/youtube/channel', authMiddleware, SocialApiController.getYoutubeChannel);
router.get('/youtube/analyze/:channelIdentifier', SocialApiController.analyzeYoutubeInfluencer);

// LinkedIn
router.get('/linkedin/profile', authMiddleware, SocialApiController.getLinkedinProfile);
router.get('/linkedin/analyze/:username', SocialApiController.analyzeLinkedinInfluencer);

export default router;