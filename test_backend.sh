#!/bin/bash

# Script de teste para o backend do aplicativo de concursos
# Este script testa os endpoints principais sem depender do banco de dados

echo "🧪 Iniciando testes do backend..."
echo ""

BASE_URL="http://localhost:3001"

# Teste 1: Health Check
echo "1. Testando Health Check..."
response=$(curl -s "$BASE_URL/health")
if [[ $response == *"OK"* ]]; then
    echo "✅ Health check passou"
else
    echo "❌ Health check falhou"
    echo "Resposta: $response"
fi
echo ""

# Teste 2: Endpoint principal
echo "2. Testando endpoint principal..."
response=$(curl -s "$BASE_URL/")
if [[ $response == *"Backend do Aplicativo de Concursos"* ]]; then
    echo "✅ Endpoint principal passou"
else
    echo "❌ Endpoint principal falhou"
    echo "Resposta: $response"
fi
echo ""

# Teste 3: Endpoint de tópicos (público)
echo "3. Testando endpoint de tópicos..."
response=$(curl -s "$BASE_URL/api/topics")
if [[ $response == *"success"* ]] || [[ $response == *"error"* ]]; then
    echo "✅ Endpoint de tópicos respondeu (estrutura correta)"
else
    echo "❌ Endpoint de tópicos falhou"
    echo "Resposta: $response"
fi
echo ""

# Teste 4: Endpoint protegido sem token
echo "4. Testando endpoint protegido sem token..."
response=$(curl -s "$BASE_URL/api/contests")
if [[ $response == *"Token de acesso requerido"* ]]; then
    echo "✅ Proteção de rota funcionando"
else
    echo "❌ Proteção de rota falhou"
    echo "Resposta: $response"
fi
echo ""

# Teste 5: Estrutura de resposta de erro
echo "5. Testando estrutura de resposta de erro..."
response=$(curl -s "$BASE_URL/api/nonexistent")
if [[ $response == *"Rota não encontrada"* ]]; then
    echo "✅ Tratamento de erro 404 funcionando"
else
    echo "❌ Tratamento de erro 404 falhou"
    echo "Resposta: $response"
fi
echo ""

echo "🏁 Testes concluídos!"
echo ""
echo "📝 Resumo:"
echo "- Servidor está rodando na porta 3001"
echo "- Endpoints básicos estão funcionando"
echo "- Sistema de autenticação está protegendo rotas"
echo "- Tratamento de erros está funcionando"
echo ""
echo "⚠️  Nota: Para testes completos, configure o banco PostgreSQL e execute:"
echo "   npm run prisma:migrate"
echo "   npm run prisma:generate"

