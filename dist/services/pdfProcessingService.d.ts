export interface ExtractedPDFData {
    text: string;
    pageCount: number;
    metadata?: any;
}
export interface ProcessedEditalData {
    topics: Array<{
        name: string;
        description: string;
        priority: number;
        subtopics: Array<{
            name: string;
            description: string;
            priority: number;
            estimatedCards: number;
        }>;
    }>;
    contestInfo: {
        institution: string;
        position: string;
        examDate?: string;
        applicationDeadline?: string;
    };
    totalTopics: number;
    totalSubtopics: number;
    totalEstimatedCards: number;
}
export declare class PDFProcessingService {
    /**
     * Extrai texto de um arquivo PDF
     */
    static extractTextFromPDF(filePath: string): Promise<ExtractedPDFData>;
    /**
     * Processa o texto do edital usando IA para extrair temas e subtemas
     */
    static processEditalWithAI(pdfText: string, contestInfo?: {
        institution?: string;
        position?: string;
        examDate?: string;
    }): Promise<ProcessedEditalData>;
    /**
     * Constrói o prompt para análise do edital
     */
    private static buildEditalAnalysisPrompt;
    /**
     * Valida e formata os dados processados
     */
    private static validateAndFormatProcessedData;
    /**
     * Calcula prioridade baseada em concursos anteriores
     */
    static calculatePriorityBasedOnHistory(topicName: string, institution: string): Promise<number>;
    /**
     * Ajusta número de cards baseado na data da prova
     */
    static calculateCardsBasedOnExamDate(basecards: number, examDate?: string): number;
}
//# sourceMappingURL=pdfProcessingService.d.ts.map