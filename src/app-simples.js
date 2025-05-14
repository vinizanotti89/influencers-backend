console.log('[DEBUG] Starting app-simple.js');

// Importar módulos principais
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configurar variáveis de ambiente primeiro
dotenv.config();
console.log('[DEBUG] Variáveis de ambiente carregadas');

// Criar aplicação Express
const app = express();
console.log('[DEBUG] Express inicializado');

// Configurar middlewares básicos
app.use(cors({
  origin: 'https://frontendpaineladm.vercel.app'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('[DEBUG] Middlewares básicos configurados');

// Rota de saúde para testar
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Rota para testar variáveis de ambiente (remover em produção)
app.get('/env-test', (req, res) => {
  res.status(200).json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongoConfigured: !!process.env.MONGODB_URI,
    redisConfigured: !!process.env.REDIS_URL
  });
});

// Middleware básico para tratamento de erros
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Ocorreu um erro inesperado' : err.message
  });
});

// Função para conectar ao MongoDB com retry
const connectToDatabase = async (retries = 5) => {
  try {
    console.log('[DB] Tentando conectar ao MongoDB...');
    console.log('[DB] URI:', process.env.MONGODB_URI ? '[CONFIGURADA]' : '[NÃO CONFIGURADA]');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não está configurada');
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('[DB] Conectado ao MongoDB com sucesso!');
    return true;
  } catch (error) {
    console.error('[DB] Erro ao conectar ao MongoDB:', error.message);
    
    if (retries > 0) {
      console.log(`[DB] Tentando novamente em 5 segundos... (${retries} tentativas restantes)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectToDatabase(retries - 1);
    } else {
      console.error('[DB] Número máximo de tentativas excedido. Continuando sem MongoDB.');
      return false;
    }
  }
};

// Função para iniciar o servidor
const startServer = async () => {
  try {
    console.log('[INIT] Iniciando servidor...');
    
    // Tenta conectar ao MongoDB, mas continua mesmo se falhar
    await connectToDatabase();
    
    // Inicia o servidor HTTP
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`[SERVER] Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('[FAIL] Erro ao iniciar servidor:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Exportar o app e a função de inicialização
export { app, startServer };

// Iniciar o servidor se este arquivo for executado diretamente
if (process.env.NODE_ENV !== 'test') {
  console.log('[DEBUG] Chamando startServer()');
  startServer();
}

console.log('[DEBUG] Fim do arquivo app-simple.js');