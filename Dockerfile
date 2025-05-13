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

# Expor porta
EXPOSE 3003

# Comando para iniciar a aplicação
CMD ["npm", "run", "start"]