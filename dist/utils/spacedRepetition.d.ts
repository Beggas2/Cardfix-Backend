export interface ReviewResult {
    repetitions: number;
    easeFactor: number;
    interval: number;
    nextReviewTime: Date;
}
export declare const calculateNextReview: (quality: number, // 0-5 rating (0 = complete blackout, 5 = perfect response)
repetitions: number, easeFactor: number, interval: number) => ReviewResult;
export declare const getCardsForReview: (userCards: any[]) => any[];
export declare const getStudyStats: (userCards: any[]) => {
    total: number;
    newCards: number;
    learning: number;
    review: number;
    graduated: number;
    dueForReview: number;
};
//# sourceMappingURL=spacedRepetition.d.ts.map