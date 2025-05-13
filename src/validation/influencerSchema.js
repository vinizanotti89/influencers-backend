import { body } from 'express-validator';

export const createInfluencerSchema = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('platform')
    .isIn(['Instagram', 'YouTube', 'TikTok'])
    .withMessage('Plataforma deve ser Instagram, YouTube ou TikTok'),
  
  body('followers')
    .isInt({ min: 0 })
    .withMessage('Número de seguidores deve ser positivo'),
  
  body('trustScore')
    .isInt({ min: 0, max: 100 })
    .withMessage('Score de confiança deve estar entre 0 e 100'),
  
  body('category')
    .isIn(['Nutrição', 'Saúde Mental', 'Fitness', 'Viagem'])
    .withMessage('Categoria inválida'),
  
  body('socialMedia.*.platform')
    .optional()
    .isString()
    .withMessage('Plataforma de mídia social deve ser texto'),
  
  body('socialMedia.*.username')
    .optional()
    .isString()
    .withMessage('Username deve ser texto'),
  
  body('socialMedia.*.url')
    .optional()
    .isURL()
    .withMessage('URL inválida')
];