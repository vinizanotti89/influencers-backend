console.log('[STARTUP] Iniciando aplicação - index.js');

// Importar apenas o mínimo necessário para testar inicialização
import dotenv from 'dotenv';

// Configurar variáveis de ambiente primeiro
console.log('[STARTUP] Configurando variáveis de ambiente');
dotenv.config();
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] PORT:', process.env.PORT);
console.log('[STARTUP] MONGODB_URI:', process.env.MONGODB_URI ? '[CONFIGURADO]' : '[NÃO CONFIGURADO]');
console.log('[STARTUP] REDIS_URL:', process.env.REDIS_URL ? '[CONFIGURADO]' : '[NÃO CONFIGURADO]');

// Tentar iniciar a aplicação com tratamento de erro detalhado
console.log('[STARTUP] Tentando iniciar a aplicação...');

// Primeiro, tenta importar a versão simplificada do app
try {
  console.log('[STARTUP] Tentando importar app-simple.js');
  import('./src/app-simple.js')
    .then(() => {
      console.log('[STARTUP] app-simple.js importado e inicializado com sucesso');
    })
    .catch((error) => {
      console.error('[STARTUP] Erro ao importar app-simple.js:', error.message);
      console.error('[STARTUP] Stack completo:', error.stack);
      
      console.error('[STARTUP] Tentando importar app.js original como fallback...');
      
      // Se falhar, tenta importar o app original como fallback
      import('./app.js')
        .then(() => {
          console.log('[STARTUP] app.js importado e inicializado com sucesso');
        })
        .catch((finalError) => {
          console.error('[STARTUP] Erro ao importar app.js:', finalError.message);
          console.error('[STARTUP] Stack completo:', finalError.stack);
          
          // Diagnóstico de problemas específicos
          if (finalError.message.includes('logger')) {
            console.error('[STARTUP] Problema detectado no módulo logger.js');
          } else if (finalError.message.includes('redis')) {
            console.error('[STARTUP] Problema detectado no módulo redis.js');
          } else if (finalError.message.includes('database')) {
            console.error('[STARTUP] Problema detectado no módulo database.js');
          } else if (finalError.message.includes('fs')) {
            console.error('[STARTUP] Problema detectado com o sistema de arquivos');
          }
          
          process.exit(1);
        });
    });
} catch (error) {
  console.error('[STARTUP] Erro crítico:', error.message);
  process.exit(1);
}