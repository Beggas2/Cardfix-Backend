"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.advancedAIService = exports.generateCardsWithRetry = exports.AdvancedAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const prisma_1 = require("../utils/prisma");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class AdvancedAIService {
    /**
     * Analyzes historical data to determine subtopic priorities
     */
    async analyzeSubtopicPriorities(contestType, institution, examDate) {
        try {
            // Get historical data from similar contests
            const historicalContests = await prisma_1.prisma.contest.findMany({
                where: {
                    OR: [
                        { name: { contains: institution } }, // Removido mode: 'insensitive'
                        { selectedOffice: { contains: contestType } }, // Removido mode: 'insensitive'
                    ],
                },
                include: {
                    contestTopics: {
                        include: {
                            topic: {
                                include: {
                                    subtopics: {
                                        include: {
                                            cards: true,
                                            _count: {
                                                select: { cards: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                take: 10, // Analyze last 10 similar contests
                orderBy: { createdAt: 'desc' }
            });
            const subtopicStats = new Map();
            // Analyze historical usage
            for (const contest of historicalContests) {
                for (const contestTopic of contest.contestTopics) {
                    for (const subtopic of contestTopic.topic.subtopics) {
                        const key = `${contestTopic.topic.name}:${subtopic.name}`;
                        const existing = subtopicStats.get(key) || {
                            totalCards: 0,
                            contestCount: 0,
                            lastUsed: null,
                            successRate: 0.5 // Default success rate
                        };
                        existing.totalCards += subtopic._count.cards;
                        existing.contestCount += 1;
                        existing.lastUsed = contest.createdAt;
                        subtopicStats.set(key, existing);
                    }
                }
            }
            // Convert to priority data
            const priorityData = [];
            for (const [key, stats] of subtopicStats.entries()) {
                const [topicName, subtopicName] = key.split(':');
                priorityData.push({
                    subtopicName,
                    topicName,
                    averageCardCount: Math.round(stats.totalCards / stats.contestCount),
                    frequency: stats.contestCount,
                    lastUsed: stats.lastUsed,
                    successRate: stats.successRate
                });
            }
            // Sort by priority (frequency * success rate)
            return priorityData.sort((a, b) => (b.frequency * b.successRate) - (a.frequency * a.successRate));
        }
        catch (error) {
            console.error('Error analyzing subtopic priorities:', error);
            return [];
        }
    }
    /**
     * Calculates optimal card count based on exam date and priority
     */
    calculateOptimalCardCount(basePriority, examDate, userTier = 'free') {
        let baseCount = 5; // Default count
        // Adjust based on user tier
        if (userTier === 'paid') {
            baseCount = 10;
        }
        // Adjust based on exam date proximity
        if (examDate) {
            const daysUntilExam = Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExam <= 30) {
                baseCount = Math.round(baseCount * 1.5); // More cards for urgent exams
            }
            else if (daysUntilExam <= 90) {
                baseCount = Math.round(baseCount * 1.2);
            }
        }
        // Adjust based on priority (1-10 scale)
        const priorityMultiplier = Math.max(0.5, Math.min(2.0, basePriority / 5));
        return Math.round(baseCount * priorityMultiplier);
    }
    /**
     * Checks if cards already exist for this subtopic and reuses them if appropriate
     */
    async getExistingCards(subtopicId, requestedCount) {
        const existingCards = await prisma_1.prisma.card.findMany({
            where: { subtopicId },
            include: {
                subtopic: {
                    include: {
                        topic: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });
        if (existingCards.length >= requestedCount) {
            // Return existing cards if we have enough
            return {
                cards: existingCards.slice(0, requestedCount).map(card => ({
                    front: card.front,
                    back: card.back,
                    difficulty: 'medium',
                    priority: 5,
                    isReused: true
                })),
                isReused: true
            };
        }
        return {
            cards: existingCards.map(card => ({
                front: card.front,
                back: card.back,
                difficulty: 'medium',
                priority: 5,
                isReused: true
            })),
            isReused: false,
            needsGeneration: requestedCount - existingCards.length
        };
    }
    /**
     * Generates cards with advanced AI prompting
     */
    async generateCardsWithAdvancedPrompt(params) {
        const { subtopicName, topicName, contestName, selectedOffice, count = 5, examDate, contestType, institution } = params;
        // Calculate days until exam for context
        let examContext = '';
        if (examDate) {
            const daysUntilExam = Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            examContext = `A prova será em ${daysUntilExam} dias. `;
        }
        const prompt = `Você é um especialista em concursos públicos brasileiros criando cards de estudo otimizados.\n\nCONTEXTO:\n- Concurso: ${contestName}\n- Cargo: ${selectedOffice || 'Não especificado'}\n- Tema: ${topicName}\n- Subtema: ${subtopicName}\n- ${examContext}\n\nINSTRUÇÕES:\n1. Crie ${count} cards de estudo no estilo "osler med" (concisos e diretos)\n2. Foque em questões que realmente caem em provas de concursos públicos\n3. Varie a dificuldade: 40% fácil, 40% médio, 20% difícil\n4. Use linguagem clara e objetiva\n5. Inclua casos práticos quando relevante\n6. Priorize conceitos fundamentais e pegadinhas comuns\n\nFORMATO DE RESPOSTA (JSON):\n{\n  "cards": [\n    {\n      "front": "Pergunta ou conceito",\n      "back": "Resposta clara e concisa",\n      "difficulty": "easy|medium|hard",\n      "priority": 1-10\n    }\n  ]\n}\n\nGere os cards agora:`;
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um especialista em concursos públicos brasileiros. Sempre responda em JSON válido.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('Resposta vazia da IA');
            }
            // Parse JSON response
            const parsed = JSON.parse(content);
            return parsed.cards || [];
        }
        catch (error) {
            console.error('Error generating cards with AI:', error);
            // Fallback: generate simple cards
            return this.generateFallbackCards(subtopicName, topicName, count);
        }
    }
    /**
     * Fallback card generation when AI fails
     */
    generateFallbackCards(subtopicName, topicName, count) {
        const fallbackCards = [];
        for (let i = 1; i <= count; i++) {
            fallbackCards.push({
                front: `Conceito ${i} de ${subtopicName}`,
                back: `Definição e aplicação prática do conceito ${i} relacionado a ${subtopicName} no contexto de ${topicName}.`,
                difficulty: i <= 2 ? 'easy' : i <= 4 ? 'medium' : 'hard',
                priority: Math.ceil(Math.random() * 10),
                isReused: false // Fallback cards are never reused
            });
        }
        return fallbackCards;
    }
    /**
     * Main method for intelligent card generation
     */
    async generateIntelligentCards(params) {
        const { subtopicId, userId, userTier, ...aiParams } = params;
        try {
            // 1. Check for existing cards
            const existingResult = await this.getExistingCards(subtopicId, params.count || 5);
            if (existingResult.isReused) {
                return {
                    cards: existingResult.cards,
                    message: 'Cards reutilizados da base de conhecimento',
                    isReused: true,
                    priorityData: null // No new priority data for reused cards
                };
            }
            // 2. Calculate optimal count based on priorities and exam date
            const priorityData = await this.analyzeSubtopicPriorities(aiParams.contestType || '', aiParams.institution || '');
            const subtopicPriority = priorityData.find(p => p.subtopicName === aiParams.subtopicName && p.topicName === aiParams.topicName);
            const optimalCount = this.calculateOptimalCardCount(subtopicPriority?.frequency || 5, aiParams.examDate, userTier);
            // 3. Generate new cards with AI
            const newCardsNeeded = existingResult.needsGeneration || optimalCount;
            const newCards = await this.generateCardsWithAdvancedPrompt({
                ...aiParams,
                count: newCardsNeeded
            });
            // 4. Combine existing and new cards
            const allCards = [...existingResult.cards, ...newCards];
            return {
                cards: allCards.slice(0, optimalCount),
                message: `${newCards.length} novos cards gerados com IA inteligente`,
                isReused: false,
                priorityData: subtopicPriority
            };
        }
        catch (error) {
            console.error('Error in intelligent card generation:', error);
            throw error;
        }
    }
}
exports.AdvancedAIService = AdvancedAIService;
// Legacy function for backward compatibility
const generateCardsWithRetry = async (params) => {
    const aiService = new AdvancedAIService();
    return aiService.generateCardsWithAdvancedPrompt(params);
};
exports.generateCardsWithRetry = generateCardsWithRetry;
exports.advancedAIService = new AdvancedAIService();
//# sourceMappingURL=advancedAIService.js.map