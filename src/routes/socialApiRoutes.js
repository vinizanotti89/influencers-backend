import express from 'express';

const router = express.Router();

// Definindo uma rota simples para testar se o Express está funcionando corretamente
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

export default router;