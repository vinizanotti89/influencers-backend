import express from 'express';
import { validateApiKey } from '../middleware/security.js';
import {
    getAllClaims,
    getClaimById,
    createClaim,
    updateClaim,
    deleteClaim
} from '../controllers/claimController.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(validateApiKey);

// Rotas para claims
router.get('/', getAllClaims);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.put('/:id', updateClaim);
router.delete('/:id', deleteClaim);

export default router;