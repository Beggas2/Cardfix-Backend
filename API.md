# API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer <token>
```

## Response Format
Todas as respostas seguem o formato:
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string
}
```

---

## 🔐 Authentication

### POST /auth/register
Registrar novo usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "name": "Nome do Usuário"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "Nome do Usuário",
      "subscriptionTier": "free",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "token": "jwt_token"
  },
  "message": "Usuário criado com sucesso"
}
```

### POST /auth/login
Fazer login.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response:** Mesmo formato do register.

### GET /auth/profile
Obter perfil do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "subscriptionTier": "free",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### PUT /auth/profile
Atualizar perfil do usuário.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Novo Nome"
}
```

---

## 🏆 Contests

### GET /contests
Listar concursos do usuário.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contest_id",
      "name": "Concurso TRT",
      "description": "Tribunal Regional do Trabalho",
      "targetDate": "2024-06-15T00:00:00.000Z",
      "examDate": "15/06/2024",
      "selectedOffice": "Analista Judiciário",
      "contestTopics": [...],
      "userCards": [...]
    }
  ]
}
```

### POST /contests
Criar novo concurso.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Concurso TRT",
  "description": "Tribunal Regional do Trabalho",
  "targetDate": "2024-06-15",
  "examDate": "15/06/2024",
  "selectedOffice": "Analista Judiciário"
}
```

### GET /contests/:id
Obter concurso específico.

### PUT /contests/:id
Atualizar concurso.

### DELETE /contests/:id
Deletar concurso.

### POST /contests/:contestId/topics
Adicionar tópico ao concurso.

**Body:**
```json
{
  "topicId": "topic_id"
}
```

### DELETE /contests/:contestId/topics/:topicId
Remover tópico do concurso.

---

## 📄 Editais

### POST /editais/:contestId/upload
Upload de edital (PDF).

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:** FormData com campo `edital` (arquivo PDF)

**Response:**
```json
{
  "success": true,
  "data": {
    "contest": {...},
    "file": {
      "fileId": "filename.pdf",
      "filename": "edital-original.pdf",
      "size": 1024000,
      "mimetype": "application/pdf"
    }
  }
}
```

### POST /editais/:contestId/process
Processar edital e extrair tópicos.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "contest_id",
    "parsedEditalData": {
      "topics": [...],
      "processedAt": "2023-01-01T00:00:00.000Z",
      "totalTopics": 3,
      "totalSubtopics": 12
    },
    "contestTopics": [...]
  }
}
```

### GET /editais/:contestId/file
Download do arquivo do edital.

### DELETE /editais/:contestId
Deletar edital do concurso.

---

## 🃏 Cards

### GET /cards
Listar cards.

**Query Parameters:**
- `subtopicId`: Filtrar por subtópico

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "card_id",
      "front": "Pergunta do card",
      "back": "Resposta do card",
      "subtopic": {
        "id": "subtopic_id",
        "name": "Nome do Subtópico",
        "topic": {
          "name": "Nome do Tópico"
        }
      },
      "creator": {
        "id": "user_id",
        "name": "Nome do Criador"
      }
    }
  ]
}
```

### POST /cards
Criar card manual.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "subtopicId": "subtopic_id",
  "front": "Pergunta do card",
  "back": "Resposta do card"
}
```

### GET /cards/:id
Obter card específico.

### PUT /cards/:id
Atualizar card (apenas criador).

### DELETE /cards/:id
Deletar card (apenas criador).

### POST /cards/generate
Gerar cards com IA.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "subtopicId": "subtopic_id",
  "contestId": "contest_id",
  "count": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cards": [...],
    "count": 5
  },
  "message": "5 cards gerados com sucesso"
}
```

---

## 📚 Study

### GET /study/session/:contestId
Obter sessão de estudo.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Número máximo de cards (padrão: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "cards": [...],
    "stats": {
      "total": 50,
      "newCards": 10,
      "learning": 15,
      "review": 20,
      "graduated": 5,
      "dueForReview": 25
    },
    "sessionSize": 20,
    "totalDue": 25
  }
}
```

### POST /study/review
Revisar card (Spaced Repetition).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "cardId": "card_id",
  "quality": 4
}
```

**Quality Scale:**
- 0: Blackout completo
- 1: Resposta incorreta, mas lembrou
- 2: Resposta incorreta, mas fácil de lembrar
- 3: Resposta correta com dificuldade
- 4: Resposta correta com hesitação
- 5: Resposta perfeita

**Response:**
```json
{
  "success": true,
  "data": {
    "userCard": {...},
    "reviewResult": {
      "quality": 4,
      "nextReview": "2023-01-05T00:00:00.000Z",
      "interval": 3,
      "status": "review"
    }
  }
}
```

### GET /study/stats/:contestId
Obter estatísticas de estudo.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total": 50,
      "newCards": 10,
      "learning": 15,
      "review": 20,
      "graduated": 5,
      "dueForReview": 25
    },
    "byTopic": [...],
    "bySubtopic": [...],
    "contest": {
      "id": "contest_id",
      "name": "Nome do Concurso",
      "targetDate": "2024-06-15T00:00:00.000Z"
    }
  }
}
```

### POST /study/cards
Adicionar card ao estudo.

**Body:**
```json
{
  "cardId": "card_id",
  "contestId": "contest_id"
}
```

### DELETE /study/cards/:cardId
Remover card do estudo.

---

## 📖 Topics & Subtopics

### GET /topics
Listar todos os tópicos (público).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "topic_id",
      "name": "Direito Constitucional",
      "description": "Tópico de Direito Constitucional",
      "subtopics": [...],
      "_count": {
        "subtopics": 4,
        "contestTopics": 10
      }
    }
  ]
}
```

### GET /topics/:id
Obter tópico específico com subtópicos e cards.

### POST /topics
Criar novo tópico.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Nome do Tópico",
  "description": "Descrição do tópico"
}
```

### PUT /topics/:id
Atualizar tópico.

### DELETE /topics/:id
Deletar tópico.

### GET /subtopics
Listar subtópicos.

**Query Parameters:**
- `topicId`: Filtrar por tópico

### GET /subtopics/:id
Obter subtópico específico.

### POST /subtopics
Criar subtópico.

**Body:**
```json
{
  "topicId": "topic_id",
  "name": "Nome do Subtópico",
  "description": "Descrição do subtópico"
}
```

### PUT /subtopics/:id
Atualizar subtópico.

### DELETE /subtopics/:id
Deletar subtópico.

---

## 🔧 Utility Endpoints

### GET /health
Health check do servidor.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "uptime": 3600.123,
  "environment": "development"
}
```

### GET /
Informações básicas da API.

**Response:**
```json
{
  "message": "Backend do Aplicativo de Concursos",
  "version": "1.0.0",
  "documentation": "/api/docs",
  "health": "/health"
}
```

---

## 🚨 Error Codes

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Dados inválidos",
  "message": "Email e senha são obrigatórios"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Token de acesso requerido"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": "Token inválido"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Recurso não encontrado"
}
```

### 429 - Rate Limit
```json
{
  "success": false,
  "error": "Limite de uso da IA atingido. Tente novamente mais tarde."
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

---

## 📝 Examples

### Fluxo completo de uso

1. **Registrar usuário**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test User"}'
```

2. **Criar concurso**
```bash
curl -X POST http://localhost:3001/api/contests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Concurso TRT","description":"Tribunal Regional do Trabalho"}'
```

3. **Upload de edital**
```bash
curl -X POST http://localhost:3001/api/editais/<contest_id>/upload \
  -H "Authorization: Bearer <token>" \
  -F "edital=@edital.pdf"
```

4. **Processar edital**
```bash
curl -X POST http://localhost:3001/api/editais/<contest_id>/process \
  -H "Authorization: Bearer <token>"
```

5. **Gerar cards com IA**
```bash
curl -X POST http://localhost:3001/api/cards/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"subtopicId":"<subtopic_id>","contestId":"<contest_id>","count":5}'
```

6. **Iniciar sessão de estudo**
```bash
curl -X GET http://localhost:3001/api/study/session/<contest_id> \
  -H "Authorization: Bearer <token>"
```

7. **Revisar card**
```bash
curl -X POST http://localhost:3001/api/study/review \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cardId":"<card_id>","quality":4}'
```

