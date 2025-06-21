import request from 'supertest';
import app from '../src/index';

describe('Backend API Tests', () => {
  describe('Health Check', () => {
    it('should return OK status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Main Endpoint', () => {
    it('should return welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.message).toBe('Backend do Aplicativo de Concursos');
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('Authentication', () => {
    it('should require token for protected routes', async () => {
      const response = await request(app)
        .get('/api/contests')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token de acesso requerido');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/contests')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token inválido');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Rota não encontrada');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

// Mock tests for database-dependent functionality
describe('Database Mock Tests', () => {
  describe('User Registration', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          name: 'Test User'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('6 caracteres');
    });
  });

  describe('Topics Endpoint', () => {
    it('should be accessible without authentication', async () => {
      const response = await request(app)
        .get('/api/topics');
      
      // Should not return 401 (authentication required)
      expect(response.status).not.toBe(401);
    });
  });
});

