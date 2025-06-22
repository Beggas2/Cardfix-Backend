export interface ParsedEditalData {
    topics: Array<{
        name: string;
        subtopics: string[];
        priority?: number;
    }>;
    processedAt: string;
    totalTopics: number;
    totalSubtopics: number;
    extractedText?: string;
}
export interface TopicPriority {
    topicName: string;
    subtopicName: string;
    priority: number;
    cardCount: number;
}
export declare const parsePDFContent: (filePath: string) => Promise<string>;
export declare const extractTopicsFromText: (text: string, contestName: string) => Promise<ParsedEditalData>;
export declare const calculateTopicPriorities: (contestName: string, selectedOffice: string, examDate: Date) => Promise<TopicPriority[]>;
export declare const generateCardsForSubtopic: (subtopicId: string, topicName: string, subtopicName: string, contestName: string, selectedOffice: string, cardCount: number) => Promise<void>;
export declare const processEditalWithAI: (contestId: string, filePath: string, contestName: string, selectedOffice: string, examDate: Date) => Promise<ParsedEditalData>;
//# sourceMappingURL=pdfService.d.ts.map