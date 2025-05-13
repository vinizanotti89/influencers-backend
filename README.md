# Painel Administrativo de Influenciadores

Sistema de monitoramento e análise de influenciadores médicos nas redes sociais.

## 🚀 Tecnologias

- Backend: Node.js com Express
- Frontend: React com Tailwind CSS
- Banco de Dados: MongoDB Atlas
- Cache: Redis
- Containerização: Docker
- Documentação: Swagger

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- Docker e Docker Compose
- MongoDB Atlas conta
- Redis

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/painel-administrativo-influenciadores.git
cd painel-administrativo-influenciadores
```

2. Instale as dependências:
```bash
cd server
npm install
cd ../client
npm install
```

3. Configure as variáveis de ambiente:
```bash

NODE_ENV=development
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@seu-cluster.mongodb.net/influencer-dashboard?retryWrites=true&w=majority&appName=ClusterInfluencers
REDIS_URL=redis://localhost:6379
PORT=3003
```

4. Inicie os containers Docker:
```bash
docker-compose up -d
```

5. Inicie o servidor:
```bash
cd server
npm run start
```

6. Em outro terminal, inicie o cliente:
```bash
cd client
npm run dev
```

## 🚀 Uso

- Acesse o painel em: http://localhost:3000
- Documentação Swagger: http://localhost:3003/api-docs

## 📊 Funcionalidades

- Dashboard com métricas principais
- Gestão de influenciadores médicos
- Monitoramento de alegações e claims
- Sistema de pontuação de confiabilidade
- Relatórios e análises
- Exportação de dados

## 🔄 Fluxo de Desenvolvimento

1. Fork o repositório
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📝 Convenções de Código

- Commits seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/)
- ESLint e Prettier para formatação
- Testes unitários para novas funcionalidades
- Documentação atualizada para mudanças na API

## 🧪 Testes

```bash
# Executar testes unitários
npm run test

# Executar testes com coverage
npm run test:coverage
```

## 📦 Estrutura do Projeto

```
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── controllers/   # Controladores da API
│   │   ├── models/        # Modelos MongoDB
│   │   ├── routes/        # Rotas da API
│   │   ├── services/      # Lógica de negócios
│   │   └── utils/         # Utilitários
│   └── tests/             # Testes
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos React
│   │   ├── hooks/         # Custom Hooks
│   │   └── styles/        # Estilos CSS
│   └── tests/             # Testes
└── docker/                # Configurações Docker
```

## 🤝 Contribuindo

Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

## 📜 Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para um registro de todas as alterações notáveis.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes.

## 🆘 Suporte

Para suporte, envie um email para vinizanotti@gmail.com ou abra uma issue no GitHub.