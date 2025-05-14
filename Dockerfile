# Use a imagem Node.js LTS
FROM node:20-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar arquivos do projeto
COPY . .

# Criar diretório de logs (para evitar erros com o logger)
RUN mkdir -p /tmp/logs

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3003
ENV LOG_LEVEL=info

# Expor porta
EXPOSE 3003

# Verificar a estrutura de diretórios (debug)
RUN ls -la && ls -la src/

# Comando para iniciar a aplicação (usando o novo index.js)
CMD ["node", "src/index.js"]