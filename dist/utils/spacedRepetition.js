"use strict";
// Spaced Repetition Algorithm (SM-2)
// Based on SuperMemo algorithm for optimal learning intervals
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudyStats = exports.getCardsForReview = exports.calculateNextReview = void 0;
const calculateNextReview = (quality, // 0-5 rating (0 = complete blackout, 5 = perfect response)
repetitions, easeFactor, interval) => {
    let newRepetitions = repetitions;
    let newEaseFactor = easeFactor;
    let newInterval = interval;
    if (quality >= 3) {
        // Correct response
        if (repetitions === 0) {
            newInterval = 1;
        }
        else if (repetitions === 1) {
            newInterval = 6;
        }
        else {
            newInterval = Math.round(interval * easeFactor);
        }
        newRepetitions = repetitions + 1;
    }
    else {
        // Incorrect response - reset repetitions
        newRepetitions = 0;
        newInterval = 1;
    }
    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    // Ensure ease factor doesn't go below 1.3
    if (newEaseFactor < 1.3) {
        newEaseFactor = 1.3;
    }
    // Calculate next review time
    const nextReviewTime = new Date();
    nextReviewTime.setDate(nextReviewTime.getDate() + newInterval);
    return {
        repetitions: newRepetitions,
        easeFactor: newEaseFactor,
        interval: newInterval,
        nextReviewTime,
    };
};
exports.calculateNextReview = calculateNextReview;
const getCardsForReview = (userCards) => {
    const now = new Date();
    return userCards.filter(userCard => {
        if (!userCard.nextReviewTime)
            return true; // New cards
        return new Date(userCard.nextReviewTime) <= now;
    });
};
exports.getCardsForReview = getCardsForReview;
const getStudyStats = (userCards) => {
    const total = userCards.length;
    const newCards = userCards.filter(uc => uc.status === 'new').length;
    const learning = userCards.filter(uc => uc.status === 'learning').length;
    const review = userCards.filter(uc => uc.status === 'review').length;
    const graduated = userCards.filter(uc => uc.status === 'graduated').length;
    const dueForReview = (0, exports.getCardsForReview)(userCards).length;
    return {
        total,
        newCards,
        learning,
        review,
        graduated,
        dueForReview,
    };
};
exports.getStudyStats = getStudyStats;
//# sourceMappingURL=spacedRepetition.js.map