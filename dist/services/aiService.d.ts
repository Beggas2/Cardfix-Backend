export interface GenerateCardsParams {
    subtopicName: string;
    topicName: string;
    contestName: string;
    selectedOffice?: string;
    count?: number;
}
export interface GeneratedCard {
    front: string;
    back: string;
}
export declare const generateCards: (params: GenerateCardsParams) => Promise<GeneratedCard[]>;
export declare const generateCardsWithRetry: (params: GenerateCardsParams, maxRetries?: number) => Promise<GeneratedCard[]>;
//# sourceMappingURL=aiService.d.ts.map