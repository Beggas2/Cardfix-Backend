interface GenerateCardsParams {
    subtopicName: string;
    topicName: string;
    contestName: string;
    selectedOffice?: string;
    count?: number;
    examDate?: string;
    contestType?: string;
    institution?: string;
}
interface CardGenerationResult {
    front: string;
    back: string;
    difficulty: 'easy' | 'medium' | 'hard';
    priority: number;
}
interface SubtopicPriorityData {
    subtopicName: string;
    topicName: string;
    averageCardCount: number;
    frequency: number;
    lastUsed: Date | null;
    successRate: number;
}
export declare class AdvancedAIService {
    /**
     * Analyzes historical data to determine subtopic priorities
     */
    analyzeSubtopicPriorities(contestType: string, institution: string, examDate?: string): Promise<SubtopicPriorityData[]>;
    /**
     * Calculates optimal card count based on exam date and priority
     */
    calculateOptimalCardCount(basePriority: number, examDate?: string, userTier?: 'free' | 'paid'): number;
    /**
     * Checks if cards already exist for this subtopic and reuses them if appropriate
     */
    getExistingCards(subtopicId: string, requestedCount: number): Promise<{
        cards: {
            front: string;
            back: string;
            difficulty: "medium";
            priority: number;
            isReused: boolean;
        }[];
        isReused: boolean;
        needsGeneration?: undefined;
    } | {
        cards: {
            front: string;
            back: string;
            difficulty: "medium";
            priority: number;
            isReused: boolean;
        }[];
        isReused: boolean;
        needsGeneration: number;
    }>;
    /**
     * Generates cards with advanced AI prompting
     */
    generateCardsWithAdvancedPrompt(params: GenerateCardsParams): Promise<CardGenerationResult[]>;
    /**
     * Fallback card generation when AI fails
     */
    private generateFallbackCards;
    /**
     * Main method for intelligent card generation
     */
    generateIntelligentCards(params: GenerateCardsParams & {
        subtopicId: string;
        userId: string;
        userTier: 'free' | 'paid';
    }): Promise<{
        cards: {
            front: string;
            back: string;
            difficulty: "medium";
            priority: number;
            isReused: boolean;
        }[] | {
            front: string;
            back: string;
            difficulty: "medium";
            priority: number;
            isReused: boolean;
        }[];
        message: string;
        isReused: boolean;
        priorityData?: undefined;
    } | {
        cards: CardGenerationResult[];
        message: string;
        isReused: boolean;
        priorityData: SubtopicPriorityData;
    }>;
}
export declare const generateCardsWithRetry: (params: GenerateCardsParams) => Promise<CardGenerationResult[]>;
export declare const advancedAIService: AdvancedAIService;
export {};
//# sourceMappingURL=advancedAIService.d.ts.map