"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFProcessingService = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class PDFProcessingService {
    /**
     * Extrai texto de um arquivo PDF
     */
    static async extractTextFromPDF(filePath) {
        try {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const data = await (0, pdf_parse_1.default)(dataBuffer);
            return {
                text: data.text,
                pageCount: data.numpages,
                metadata: data.metadata,
            };
        }
        catch (error) {
            console.error('Erro ao extrair texto do PDF:', error);
            throw new Error('Falha ao processar o arquivo PDF');
        }
    }
    /**
     * Processa o texto do edital usando IA para extrair temas e subtemas
     */
    static async processEditalWithAI(pdfText, contestInfo) {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('Chave da API OpenAI não configurada');
            }
            const prompt = this.buildEditalAnalysisPrompt(pdfText, contestInfo);
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um especialista em análise de editais de concursos públicos brasileiros. Sua tarefa é extrair e organizar informações sobre temas e subtemas de estudo, priorizando-os com base na relevância e frequência em concursos similares.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('Resposta vazia da API OpenAI');
            }
            // Parse da resposta JSON
            const parsedData = JSON.parse(response);
            // Validação e formatação dos dados
            return this.validateAndFormatProcessedData(parsedData);
        }
        catch (error) {
            console.error('Erro ao processar edital com IA:', error);
            throw new Error('Falha ao analisar o edital com IA');
        }
    }
    /**
     * Constrói o prompt para análise do edital
     */
    static buildEditalAnalysisPrompt(pdfText, contestInfo) {
        const contextInfo = contestInfo ? `
Informações do concurso:
- Instituição: ${contestInfo.institution || 'Não informado'}
- Cargo: ${contestInfo.position || 'Não informado'}
- Data da prova: ${contestInfo.examDate || 'Não informado'}
` : '';
        return `
${contextInfo}

Analise o seguinte texto de edital de concurso público e extraia as informações solicitadas:

TEXTO DO EDITAL:
${pdfText.substring(0, 15000)} // Limitando para evitar excesso de tokens

INSTRUÇÕES:
1. Identifique todos os temas e subtemas de estudo mencionados no edital
2. Priorize os temas baseado na experiência de concursos similares (1-10, sendo 10 mais importante)
3. Para cada subtema, estime o número ideal de cards de estudo (5-50 cards)
4. Considere a data da prova para ajustar o número de cards (se disponível)
5. Extraia informações básicas do concurso

RESPONDA APENAS COM UM JSON VÁLIDO no seguinte formato:
{
  "contestInfo": {
    "institution": "Nome da instituição",
    "position": "Cargo/função",
    "examDate": "Data da prova (YYYY-MM-DD ou null)",
    "applicationDeadline": "Prazo de inscrição (YYYY-MM-DD ou null)"
  },
  "topics": [
    {
      "name": "Nome do tema",
      "description": "Descrição breve do tema",
      "priority": 8,
      "subtopics": [
        {
          "name": "Nome do subtema",
          "description": "Descrição breve do subtema",
          "priority": 7,
          "estimatedCards": 25
        }
      ]
    }
  ]
}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional.
`;
    }
    /**
     * Valida e formata os dados processados
     */
    static validateAndFormatProcessedData(data) {
        if (!data.topics || !Array.isArray(data.topics)) {
            throw new Error('Dados de temas inválidos');
        }
        let totalSubtopics = 0;
        let totalEstimatedCards = 0;
        // Validação e cálculo de totais
        data.topics.forEach((topic) => {
            if (!topic.subtopics || !Array.isArray(topic.subtopics)) {
                topic.subtopics = [];
            }
            totalSubtopics += topic.subtopics.length;
            topic.subtopics.forEach((subtopic) => {
                totalEstimatedCards += subtopic.estimatedCards || 0;
            });
        });
        return {
            topics: data.topics,
            contestInfo: data.contestInfo || {},
            totalTopics: data.topics.length,
            totalSubtopics,
            totalEstimatedCards,
        };
    }
    /**
     * Calcula prioridade baseada em concursos anteriores
     */
    static async calculatePriorityBasedOnHistory(topicName, institution) {
        // Esta função pode ser expandida para consultar um banco de dados
        // de concursos anteriores e calcular a frequência de aparição dos temas
        // Por enquanto, retorna uma prioridade baseada em padrões conhecidos
        const commonTopics = [
            'direito constitucional',
            'direito administrativo',
            'português',
            'matemática',
            'informática',
            'raciocínio lógico'
        ];
        const topicLower = topicName.toLowerCase();
        for (let i = 0; i < commonTopics.length; i++) {
            if (topicLower.includes(commonTopics[i])) {
                return 10 - i; // Prioridade decrescente
            }
        }
        return 5; // Prioridade média para temas não reconhecidos
    }
    /**
     * Ajusta número de cards baseado na data da prova
     */
    static calculateCardsBasedOnExamDate(basecards, examDate) {
        if (!examDate)
            return basecards;
        try {
            const exam = new Date(examDate);
            const now = new Date();
            const daysUntilExam = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExam <= 0)
                return basecards;
            // Ajusta baseado no tempo disponível
            if (daysUntilExam < 30) {
                return Math.ceil(basecards * 0.7); // Reduz 30% se menos de 30 dias
            }
            else if (daysUntilExam < 60) {
                return Math.ceil(basecards * 0.85); // Reduz 15% se menos de 60 dias
            }
            else if (daysUntilExam > 180) {
                return Math.ceil(basecards * 1.3); // Aumenta 30% se mais de 6 meses
            }
            return basecards;
        }
        catch (error) {
            console.error('Erro ao calcular cards baseado na data:', error);
            return basecards;
        }
    }
}
exports.PDFProcessingService = PDFProcessingService;
//# sourceMappingURL=pdfProcessingService.js.map