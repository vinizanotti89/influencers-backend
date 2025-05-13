import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Monitoramento de Influenciadores',
      version: '1.0.0',
      description: 'API para monitoramento e análise de alegações de influenciadores',
      contact: {
        name: 'Equipe de Desenvolvimento',
        email: 'vinizanotti@gmail.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Arquivos que contêm anotações do Swagger
};

const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app, port) => {
  // Rota para a documentação do Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Rota para o arquivo JSON do Swagger
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📝 Documentação Swagger disponível em http://localhost:${port}/api-docs`);
};