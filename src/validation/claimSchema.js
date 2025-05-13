import { body } from 'express-validator';

export const validateClaim = [
    body('influencerId')
      .isMongoId()
      .withMessage('ID do influenciador inválido'),
    
    body('content')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Conteúdo deve ter no mínimo 10 caracteres'),
    
    body('category')
      .isIn(['nutrition', 'medical', 'fitness'])
      .withMessage('Categoria inválida'),
    
    body('status')
      .isIn(['pending', 'verified', 'questionable', 'refuted'])
      .withMessage('Status inválido'),
    
    body('trustScore')
      .isInt({ min: 0, max: 100 })
      .withMessage('Score de confiança deve estar entre 0 e 100'),
    
    body('originalSource.url')
      .optional()
      .isURL()
      .withMessage('URL da fonte original inválida'),
    
    body('originalSource.engagement.likes')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Número de likes deve ser positivo'),
    
    body('studies.*.title')
      .optional()
      .isString()
      .withMessage('Título do estudo deve ser texto'),
    
    body('studies.*.year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage('Ano do estudo inválido')
];