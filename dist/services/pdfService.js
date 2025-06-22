"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEditalWithAI = exports.generateCardsForSubtopic = exports.calculateTopicPriorities = exports.extractTopicsFromText = exports.parsePDFContent = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const aiService_1 = require("./aiService");
const prisma_1 = require("../utils/prisma");
const parsePDFContent = async (filePath) => {
    try {
        const dataBuffer = fs_1.default.readFileSync(filePath);
        const data = await (0, pdf_parse_1.default)(dataBuffer);
        return data.text;
    }
    catch (error) {
        console.error('Erro ao fazer parse do PDF:', error);
        throw new Error('Erro ao processar arquivo PDF');
    }
};
exports.parsePDFContent = parsePDFContent;
const extractTopicsFromText = async (text, contestName) => {
    // Implementação básica de extração de tópicos usando IA
    const prompt = `
Analise o seguinte texto de edital de concurso público e extraia os tópicos e subtópicos de estudo:

**Concurso:** ${contestName}

**Texto do Edital:**
${text.substring(0, 8000)} // Limitando para evitar tokens excessivos

**Instruções:**
1. Identifique as matérias/disciplinas principais
2. Para cada matéria, liste os subtópicos específicos
3. Foque apenas no conteúdo programático
4. Ignore informações administrativas do concurso

**Formato de resposta:**
Retorne APENAS um JSON válido no seguinte formato:

{
  "topics": [
    {
      "name": "Nome da Matéria",
      "subtopics": ["Subtópico 1", "Subtópico 2", "Subtópico 3"]
    }
  ]
}

**Exemplo:**
{
  "topics": [
    {
      "name": "Direito Constitucional",
      "subtopics": ["Princípios Fundamentais", "Direitos e Garantias Fundamentais", "Organização do Estado"]
    },
    {
      "name": "Português",
      "subtopics": ["Interpretação de Textos", "Gramática", "Ortografia"]
    }
  ]
}
`;
    try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um especialista em análise de editais de concursos públicos brasileiros. Sempre responda com JSON válido.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.3,
            max_tokens: 2000,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Nenhum conteúdo retornado pela IA');
        }
        let parsedData;
        try {
            parsedData = JSON.parse(content);
        }
        catch (parseError) {
            console.error('Erro ao fazer parse da resposta da IA:', content);
            // Fallback para tópicos padrão
            parsedData = {
                topics: [
                    {
                        name: 'Direito Constitucional',
                        subtopics: ['Princípios Fundamentais', 'Direitos e Garantias Fundamentais', 'Organização do Estado'],
                    },
                    {
                        name: 'Direito Administrativo',
                        subtopics: ['Princípios da Administração Pública', 'Atos Administrativos', 'Processo Administrativo'],
                    },
                    {
                        name: 'Português',
                        subtopics: ['Interpretação de Textos', 'Gramática', 'Ortografia'],
                    },
                ],
            };
        }
        return {
            topics: parsedData.topics || [],
            processedAt: new Date().toISOString(),
            totalTopics: parsedData.topics?.length || 0,
            totalSubtopics: parsedData.topics?.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0) || 0,
            extractedText: text.substring(0, 1000), // Armazenar uma amostra do texto
        };
    }
    catch (error) {
        console.error('Erro ao extrair tópicos com IA:', error);
        // Fallback para tópicos padrão em caso de erro
        return {
            topics: [
                {
                    name: 'Direito Constitucional',
                    subtopics: ['Princípios Fundamentais', 'Direitos e Garantias Fundamentais', 'Organização do Estado'],
                },
                {
                    name: 'Direito Administrativo',
                    subtopics: ['Princípios da Administração Pública', 'Atos Administrativos', 'Processo Administrativo'],
                },
                {
                    name: 'Português',
                    subtopics: ['Interpretação de Textos', 'Gramática', 'Ortografia'],
                },
            ],
            processedAt: new Date().toISOString(),
            totalTopics: 3,
            totalSubtopics: 9,
            extractedText: text.substring(0, 1000),
        };
    }
};
exports.extractTopicsFromText = extractTopicsFromText;
const calculateTopicPriorities = async (contestName, selectedOffice, examDate) => {
    // Implementação básica de priorização baseada em histórico
    // Em uma implementação real, isso consultaria um banco de dados de concursos anteriores
    const daysUntilExam = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    // Prioridades baseadas em padrões comuns de concursos públicos
    const defaultPriorities = [
        { topicName: 'Direito Constitucional', subtopicName: 'Princípios Fundamentais', priority: 10, cardCount: 15 },
        { topicName: 'Direito Constitucional', subtopicName: 'Direitos e Garantias Fundamentais', priority: 9, cardCount: 20 },
        { topicName: 'Direito Constitucional', subtopicName: 'Organização do Estado', priority: 8, cardCount: 12 },
        { topicName: 'Direito Administrativo', subtopicName: 'Princípios da Administração Pública', priority: 9, cardCount: 18 },
        { topicName: 'Direito Administrativo', subtopicName: 'Atos Administrativos', priority: 8, cardCount: 15 },
        { topicName: 'Direito Administrativo', subtopicName: 'Processo Administrativo', priority: 7, cardCount: 10 },
        { topicName: 'Português', subtopicName: 'Interpretação de Textos', priority: 10, cardCount: 25 },
        { topicName: 'Português', subtopicName: 'Gramática', priority: 8, cardCount: 20 },
        { topicName: 'Português', subtopicName: 'Ortografia', priority: 6, cardCount: 10 },
    ];
    // Ajustar quantidade de cards baseado no tempo disponível
    const timeMultiplier = daysUntilExam > 90 ? 1.5 : daysUntilExam > 30 ? 1.0 : 0.7;
    return defaultPriorities.map(priority => ({
        ...priority,
        cardCount: Math.ceil(priority.cardCount * timeMultiplier),
    }));
};
exports.calculateTopicPriorities = calculateTopicPriorities;
const generateCardsForSubtopic = async (subtopicId, topicName, subtopicName, contestName, selectedOffice, cardCount) => {
    try {
        // Verificar se já existem cards para este subtópico
        const existingCards = await prisma_1.prisma.card.findMany({
            where: { subtopicId },
        });
        if (existingCards.length >= cardCount) {
            console.log(`Subtópico ${subtopicName} já possui ${existingCards.length} cards, pulando geração.`);
            return;
        }
        const cardsToGenerate = cardCount - existingCards.length;
        console.log(`Gerando ${cardsToGenerate} cards para ${topicName} - ${subtopicName}`);
        const generatedCards = await (0, aiService_1.generateCardsWithRetry)({
            subtopicName,
            topicName,
            contestName,
            selectedOffice,
            count: cardsToGenerate,
        });
        // Salvar cards no banco de dados
        for (const card of generatedCards) {
            await prisma_1.prisma.card.create({
                data: {
                    subtopicId,
                    front: card.front,
                    back: card.back,
                    difficulty: 'medium', // Dificuldade padrão
                    createdBy: 'system', // Cards gerados pelo sistema
                },
            });
        }
        console.log(`${generatedCards.length} cards criados para ${subtopicName}`);
    }
    catch (error) {
        console.error(`Erro ao gerar cards para ${subtopicName}:`, error);
        throw error;
    }
};
exports.generateCardsForSubtopic = generateCardsForSubtopic;
const processEditalWithAI = async (contestId, filePath, contestName, selectedOffice, examDate) => {
    try {
        // 1. Extrair texto do PDF
        console.log('Extraindo texto do PDF...');
        const extractedText = await (0, exports.parsePDFContent)(filePath);
        // 2. Extrair tópicos e subtópicos usando IA
        console.log('Extraindo tópicos com IA...');
        const parsedData = await (0, exports.extractTopicsFromText)(extractedText, contestName);
        // 3. Calcular prioridades
        console.log('Calculando prioridades...');
        const priorities = await (0, exports.calculateTopicPriorities)(contestName, selectedOffice, examDate);
        // 4. Criar tópicos e subtópicos no banco de dados
        console.log('Criando tópicos e subtópicos...');
        for (const topicData of parsedData.topics) {
            // Criar ou obter tópico
            const topic = await prisma_1.prisma.topic.upsert({
                where: { name: topicData.name },
                update: {},
                create: {
                    name: topicData.name,
                    description: `Tópico de ${topicData.name}`,
                },
            });
            // Adicionar tópico ao concurso
            await prisma_1.prisma.contestTopic.upsert({
                where: {
                    contestId_topicId: {
                        contestId,
                        topicId: topic.id,
                    },
                },
                update: {},
                create: {
                    contestId,
                    topicId: topic.id,
                    userId: '', // Será preenchido pelo controller
                },
            });
            // Criar subtópicos
            for (const subtopicName of topicData.subtopics) {
                const subtopic = await prisma_1.prisma.subtopic.upsert({
                    where: {
                        topicId_name: {
                            topicId: topic.id,
                            name: subtopicName,
                        },
                    },
                    update: {},
                    create: {
                        topicId: topic.id,
                        name: subtopicName,
                        description: `Subtópico de ${subtopicName}`,
                    },
                });
                // Encontrar prioridade para este subtópico
                const priority = priorities.find(p => p.topicName === topicData.name && p.subtopicName === subtopicName);
                if (priority) {
                    // Gerar cards para este subtópico
                    await (0, exports.generateCardsForSubtopic)(subtopic.id, topicData.name, subtopicName, contestName, selectedOffice, priority.cardCount);
                }
            }
        }
        return parsedData;
    }
    catch (error) {
        console.error('Erro no processamento do edital com IA:', error);
        throw error;
    }
};
exports.processEditalWithAI = processEditalWithAI;
//# sourceMappingURL=pdfService.js.map