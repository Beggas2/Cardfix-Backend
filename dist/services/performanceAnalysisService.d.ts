export interface PerformanceMetrics {
    totalStudyTime: number;
    totalReviews: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    averageResponseTime: number;
    streakDays: number;
    lastStudyDate: Date | null;
}
export interface ContestPerformance extends PerformanceMetrics {
    contestId: string;
    contestName: string;
    topicPerformance: TopicPerformance[];
    progressOverTime: DailyProgress[];
    difficultyDistribution: DifficultyStats[];
}
export interface TopicPerformance extends PerformanceMetrics {
    topicId: string;
    topicName: string;
    subtopicPerformance: SubtopicPerformance[];
}
export interface SubtopicPerformance extends PerformanceMetrics {
    subtopicId: string;
    subtopicName: string;
    cardsTotal: number;
    cardsLearned: number;
    cardsToReview: number;
    averageEaseFactor: number;
}
export interface DailyProgress {
    date: string;
    reviewsCount: number;
    correctCount: number;
    studyTimeMinutes: number;
    newCardsLearned: number;
}
export interface DifficultyStats {
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    accuracy: number;
}
export declare class PerformanceAnalysisService {
    getContestPerformance(userId: string, contestId: string): Promise<ContestPerformance>;
    getTopicPerformance(userId: string, topicId: string): Promise<TopicPerformance>;
    getSubtopicPerformance(userId: string, subtopicId: string): Promise<SubtopicPerformance>;
    getOverallPerformance(userId: string): Promise<PerformanceMetrics & {
        contestsCount: number;
    }>;
    private calculateMetrics;
    private calculateTopicPerformance;
    private calculateSubtopicPerformance;
    private calculateDailyProgress;
    private calculateDifficultyDistribution;
    private calculateStreakDays;
}
export declare const performanceAnalysisService: PerformanceAnalysisService;
//# sourceMappingURL=performanceAnalysisService.d.ts.map