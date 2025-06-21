# Guia de Instalação e Deploy

## 🚀 Instalação Local

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 12+
- Conta OpenAI (para geração de cards)

### 1. Clone e instale dependências
```bash
git clone <repository-url>
cd concurso_backend
npm install
```

### 2. Configure o banco de dados PostgreSQL

#### Opção A: PostgreSQL Local
```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar banco de dados
sudo -u postgres createdb concurso_db
sudo -u postgres createuser --interactive
```

#### Opção B: PostgreSQL na nuvem (Recomendado)
- **Supabase**: https://supabase.com (Gratuito)
- **Railway**: https://railway.app (Gratuito)
- **Neon**: https://neon.tech (Gratuito)

### 3. Configure variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Database (substitua pela sua URL)
DATABASE_URL="postgresql://username:password@localhost:5432/concurso_db?schema=public"

# JWT (gere uma chave segura)
JWT_SECRET="sua-chave-super-secreta-aqui"
JWT_EXPIRES_IN="7d"

# OpenAI (obtenha em https://platform.openai.com)
OPENAI_API_KEY="sk-..."

# Server
PORT=3001
NODE_ENV="development"

# CORS (URL do frontend)
CORS_ORIGIN="http://localhost:5173"
```

### 4. Configure o banco de dados
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# (Opcional) Visualizar dados
npm run prisma:studio
```

### 5. Execute o servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🌐 Deploy em Produção

### Railway (Recomendado)

1. **Conecte o repositório**
   - Acesse https://railway.app
   - Conecte sua conta GitHub
   - Importe o repositório

2. **Configure o banco PostgreSQL**
   - Adicione o plugin PostgreSQL
   - Copie a `DATABASE_URL` gerada

3. **Configure variáveis de ambiente**
   ```
   DATABASE_URL=<url-do-railway>
   JWT_SECRET=<chave-segura>
   OPENAI_API_KEY=<sua-chave>
   NODE_ENV=production
   CORS_ORIGIN=<url-do-frontend>
   ```

4. **Deploy automático**
   - Railway fará deploy automaticamente
   - Execute migrations: `npm run prisma:migrate`

### Render

1. **Criar Web Service**
   - Acesse https://render.com
   - Conecte repositório GitHub
   - Escolha "Web Service"

2. **Configurações**
   ```
   Build Command: npm install && npm run build && npm run prisma:generate
   Start Command: npm run prisma:migrate && npm start
   ```

3. **Variáveis de ambiente**
   - Configure as mesmas variáveis do Railway

### Vercel (Serverless)

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configurar vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "dist/index.js"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

## 🐳 Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Copiar código
COPY . .

# Build
RUN npm run build
RUN npm run prisma:generate

# Expor porta
EXPOSE 3001

# Comando de inicialização
CMD ["sh", "-c", "npm run prisma:migrate && npm start"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/concurso_db
      - JWT_SECRET=your-secret-key
      - OPENAI_API_KEY=your-openai-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=concurso_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Executar com Docker
```bash
docker-compose up -d
```

## 🔧 Configurações Avançadas

### Nginx (Proxy Reverso)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Criar ecosystem.config.js
module.exports = {
  apps: [{
    name: 'concurso-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔒 Segurança

### SSL/HTTPS
```bash
# Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Firewall
```bash
# UFW (Ubuntu)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📊 Monitoramento

### Logs
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f app
```

### Health Check
```bash
curl https://seu-dominio.com/health
```

## 🔄 Backup

### Banco de dados
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Arquivos
```bash
# Backup uploads
tar -czf uploads-backup.tar.gz uploads/
```

## 🚨 Troubleshooting

### Problemas comuns

1. **Erro de conexão com banco**
   ```bash
   # Verificar conexão
   npm run prisma:studio
   ```

2. **Erro de CORS**
   ```env
   # Verificar CORS_ORIGIN no .env
   CORS_ORIGIN="https://seu-frontend.com"
   ```

3. **Erro de OpenAI**
   ```bash
   # Verificar API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
   ```

4. **Erro de upload**
   ```bash
   # Verificar permissões
   chmod 755 uploads/
   ```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs da aplicação
2. Consulte a documentação do Prisma
3. Verifique as configurações de ambiente
4. Teste endpoints com curl ou Postman

