"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCardsWithRetry = exports.generateCards = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const generateCards = async (params) => {
    const { subtopicName, topicName, contestName, selectedOffice, count = 5 } = params;
    const prompt = `
Você é um especialista em concursos públicos brasileiros. Gere ${count} cards de estudo (flashcards) para o seguinte contexto:

**Concurso:** ${contestName}
**Cargo:** ${selectedOffice || 'Não especificado'}
**Matéria:** ${topicName}
**Subtópico:** ${subtopicName}

**Instruções:**
1. Crie cards no formato pergunta/resposta ou conceito/definição
2. Foque em conhecimentos específicos e práticos para concursos públicos
3. Use linguagem clara e objetiva
4. Inclua detalhes importantes como números, datas, percentuais quando relevante
5. Priorize conteúdo que costuma ser cobrado em provas

**Formato de resposta:**
Retorne APENAS um JSON válido com um array de objetos, cada um contendo "front" e "back":

[
  {
    "front": "Pergunta ou conceito aqui",
    "back": "Resposta ou definição detalhada aqui"
  }
]

**Exemplo para Direito Constitucional - Princípios Fundamentais:**
[
  {
    "front": "Quais são os fundamentos da República Federativa do Brasil segundo o art. 1º da CF/88?",
    "back": "I - a soberania; II - a cidadania; III - a dignidade da pessoa humana; IV - os valores sociais do trabalho e da livre iniciativa; V - o pluralismo político."
  }
]

Agora gere os cards para o subtópico solicitado:
`;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um especialista em concursos públicos brasileiros. Sempre responda com JSON válido contendo um array de cards.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Nenhum conteúdo retornado pela IA');
        }
        // Parse JSON response
        let cards;
        try {
            cards = JSON.parse(content);
        }
        catch (parseError) {
            console.error('Erro ao fazer parse da resposta da IA:', content);
            throw new Error('Resposta da IA não está em formato JSON válido');
        }
        // Validate response format
        if (!Array.isArray(cards)) {
            throw new Error('Resposta da IA não é um array');
        }
        // Validate each card
        const validCards = cards.filter(card => card &&
            typeof card === 'object' &&
            typeof card.front === 'string' &&
            typeof card.back === 'string' &&
            card.front.trim().length > 0 &&
            card.back.trim().length > 0);
        if (validCards.length === 0) {
            throw new Error('Nenhum card válido foi gerado');
        }
        return validCards;
    }
    catch (error) {
        console.error('Erro ao gerar cards com IA:', error);
        throw error;
    }
};
exports.generateCards = generateCards;
const generateCardsWithRetry = async (params, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const cards = await (0, exports.generateCards)(params);
            return cards;
        }
        catch (error) {
            lastError = error;
            console.error(`Tentativa ${attempt} falhou:`, error);
            if (attempt < maxRetries) {
                // Wait before retry (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
};
exports.generateCardsWithRetry = generateCardsWithRetry;
//# sourceMappingURL=aiService.js.map