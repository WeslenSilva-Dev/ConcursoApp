# ConcursoApp

Plataforma inteligente de estudos para concursos públicos.

## Descrição

O ConcursoApp é uma aplicação web desenvolvida para ajudar estudantes a se prepararem para concursos públicos de forma organizada e eficiente. Oferece ferramentas para gerenciamento de ciclos de estudo, revisões programadas, anotações, metas e estatísticas de progresso.

## Funcionalidades

- **Ciclos de Estudo**: Criação e gerenciamento de ciclos de estudo personalizados
- **Revisões**: Sistema de revisões espaçadas para melhor retenção
- **Anotações**: Organização de notas por disciplina
- **Metas**: Definição e acompanhamento de metas diárias e semanais
- **Estatísticas**: Visualização de progresso e desempenho
- **Modo Foco**: Ambiente dedicado para sessões de estudo concentrado
- **Dashboard**: Visão geral do progresso e atividades pendentes

## Stack Tecnológica

### Backend
- **Node.js**: Ambiente de execução JavaScript
- **Express.js**: Framework web para Node.js
- **MongoDB**: Banco de dados NoSQL
- **Mongoose**: ODM para MongoDB

### Frontend
- **EJS**: Engine de templates
- **CSS**: Estilização customizada
- **JavaScript**: Interatividade do lado cliente

### Autenticação e Segurança
- **JWT**: Autenticação baseada em tokens
- **bcryptjs**: Hashing de senhas

### Outros
- **Google GenAI**: Integração com IA para funcionalidades avançadas
- **Multer**: Upload de arquivos
- **PDF-parse**: Processamento de arquivos PDF

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd concursoapp
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/concursoapp
   JWT_SECRET=sua-chave-secreta
   GOOGLE_GENAI_API_KEY=sua-chave-api
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```

   Para desenvolvimento:
   ```bash
   npm run dev
   ```

## Licença

Este projeto está sob a licença MIT.

Copyright (c) 2026 Weslen Silva