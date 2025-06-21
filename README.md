## Backend do Aplicativo de Concursos

Este repositório contém o código-fonte do backend do aplicativo de concursos, desenvolvido com Node.js, Express e TypeScript. Ele é responsável por gerenciar usuários, concursos, editais, temas, cards e o sistema de repetição espaçada.

### Tecnologias

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (recomendado para produção) / SQLite (para desenvolvimento local)
- JWT para autenticação
- Multer para upload de arquivos
- OpenAI API para geração de cards (opcional)
- -

### Estrutura de Pastas

```
.env.example
prisma/
  schema.prisma
src/
  controllers/
  middleware/
  models/
  routes/
  services/
  types/
  utils/
package.json
tsconfig.json
...
```

### Configuração Local

1.  **Variáveis de Ambiente**: Crie um arquivo `.env` na raiz do projeto com base no `.env.example` (você precisará criar este arquivo, veja abaixo).
    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    JWT_SECRET="seu_segredo_jwt"
    OPENAI_API_KEY="sua_chave_openai" # Opcional
    PORT=3001
    ```
    Para desenvolvimento local com SQLite, use:
    ```
    DATABASE_URL="file:./dev.db"
    JWT_SECRET="seu_segredo_jwt"
    OPENAI_API_KEY="sua_chave_openai" # Opcional
    PORT=3001
    ```

2.  **Instalar Dependências**:
    ```bash
    npm install
    ```

3.  **Configurar Banco de Dados (Prisma)**:
    Se estiver usando PostgreSQL, certifique-se de que seu `DATABASE_URL` no `.env` esteja correto.
    Para SQLite, o arquivo `dev.db` será criado automaticamente.
    Execute as migrações e gere o cliente Prisma:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Iniciar o Servidor**:
    ```bash
    npm run dev
    ```
    O servidor estará rodando em `http://localhost:3001`.

### Implantação (Railway)

1.  **Crie um novo projeto no Railway**: Conecte seu repositório GitHub.
2.  **Variáveis de Ambiente**: Configure as variáveis de ambiente no Railway (DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, PORT).
    *   Para `DATABASE_URL`, o Railway pode provisionar um banco PostgreSQL para você.
    *   `PORT` deve ser `3001`.
3.  **Comando de Build**: `npm install && npm run build`
4.  **Comando de Start**: `npm start` (certifique-se de que seu `package.json` tenha um script `start` que execute o `dist/index.js`)

### Scripts no `package.json`

Certifique-se de que seu `package.json` no backend tenha os seguintes scripts:

```json
{
  "name": "concurso_backend",
  "version": "1.0.0",
  "description": "Backend do aplicativo de concursos",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "test": "jest"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "axios": "^1.7.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.52.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/morgan": "^1.9.9",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.14.9",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.3"
  }
}
```

**Importante**: O Railway vai precisar que você configure o `DATABASE_URL` para o banco de dados que ele provisionar. Além disso, certifique-se de que o `start` script no `package.json` do backend aponte para o arquivo JavaScript compilado (geralmente em `dist/index.js`).

