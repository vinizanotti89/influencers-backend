import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { Influencer } from '../models/Influencer.js';

console.log('Teste inicial - verificando ambiente Node.js');

// Verificar variáveis de ambiente
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Porta:', process.env.PORT);
console.log('Diretório atual:', process.cwd());
console.log('Arquivos no diretório:');

// Listar arquivos do diretório
const fs = require('fs');
fs.readdir('.', (err, files) => {
  if (err) {
    console.error('Erro ao listar arquivos:', err);
    return;
  }
  console.log(files);
  
  // Verificar se o arquivo app.js existe
  console.log('Verificando estrutura de diretórios:');
  if (files.includes('src')) {
    fs.readdir('./src', (err, srcFiles) => {
      if (err) {
        console.error('Erro ao listar arquivos em src:', err);
        return;
      }
      console.log('Arquivos em src:', srcFiles);
    });
  }
});