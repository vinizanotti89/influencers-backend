import express from 'express';
import { InfluencerController } from '../controllers/influencerController.js';
import { validateRequest } from '../middleware/validator.js';
import { authMiddleware } from '../middleware/auth.js';
import { cacheMiddleware } from '../config/redis.js';

const router = express.Router();

// Rota de busca por username e plataforma - adicionar esta rota que é chamada pelo front-end
router.get('/search', cacheMiddleware(300), InfluencerController.searchInfluencer);

// Rotas existentes 
router.get('/', cacheMiddleware(300), InfluencerController.getInfluencers);
router.get('/:id', cacheMiddleware(300), InfluencerController.getInfluencerById);
router.post('/', authMiddleware, validateRequest, InfluencerController.createInfluencer);
router.put('/:id', authMiddleware, validateRequest, InfluencerController.updateInfluencer);
router.delete('/:id', authMiddleware, InfluencerController.deleteInfluencer);

export default router;