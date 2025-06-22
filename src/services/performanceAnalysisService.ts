import { prisma } from '../utils/prisma';

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

export class PerformanceAnalysisService {
  
  async getContestPerformance(userId: string, contestId: string): Promise<ContestPerformance> {
    // Get contest info
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        contestTopics: {
          include: {
            topic: {
              include: {
                subtopics: {
                  include: {
                    cards: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!contest) {
      throw new Error('Contest not found');
    }

    // Get all study sessions for this contest
    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        card: {
          subtopic: {
            topic: {
              contestTopics: {
                some: {
                  contestId
                }
              }
            }
          }
        }
      },
      include: {
        card: {
          include: {
            subtopic: {
              include: {
                topic: true
              }
            }
          }
        }
      },
      orderBy: {
        reviewedAt: 'asc'
      }
    });

    // Calculate overall contest metrics
    const contestMetrics = this.calculateMetrics(studySessions);

    // Calculate topic performance
    const topicPerformance = await this.calculateTopicPerformance(userId, contest.contestTopics, studySessions);

    // Calculate progress over time
    const progressOverTime = this.calculateDailyProgress(studySessions);

    // Calculate difficulty distribution
    const difficultyDistribution = this.calculateDifficultyDistribution(studySessions);

    return {
      contestId,
      contestName: contest.name,
      ...contestMetrics,
      topicPerformance,
      progressOverTime,
      difficultyDistribution
    };
  }

  async getTopicPerformance(userId: string, topicId: string): Promise<TopicPerformance> {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subtopics: {
          include: {
            cards: true
          }
        }
      }
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        card: {
          subtopic: {
            topicId
          }
        }
      },
      include: {
        card: {
          include: {
            subtopic: true
          }
        }
      }
    });

    const topicMetrics = this.calculateMetrics(studySessions);
    const subtopicPerformance = await this.calculateSubtopicPerformance(userId, topic.subtopics, studySessions);

    return {
      topicId,
      topicName: topic.name,
      ...topicMetrics,
      subtopicPerformance
    };
  }

  async getSubtopicPerformance(userId: string, subtopicId: string): Promise<SubtopicPerformance> {
    const subtopic = await prisma.subtopic.findUnique({
      where: { id: subtopicId },
      include: {
        cards: true
      }
    });

    if (!subtopic) {
      throw new Error('Subtopic not found');
    }

    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        card: {
          subtopicId
        }
      },
      include: {
        card: true
      }
    });

    const subtopicMetrics = this.calculateMetrics(studySessions);

    // Calculate additional subtopic-specific metrics
    const cardsTotal = subtopic.cards.length;
    const cardsLearned = await prisma.card.count({
      where: {
        subtopicId,
        studySessions: {
          some: {
            userId,
            quality: {
              gte: 3 // Consider cards with quality >= 3 as learned
            }
          }
        }
      }
    });

    const cardsToReview = await prisma.card.count({
      where: {
        subtopicId,
        studySessions: {
          some: {
            userId,
            nextReviewDate: {
              lte: new Date()
            }
          }
        }
      }
    });

    // Calculate average ease factor
    const avgEaseResult = await prisma.studySession.aggregate({
      where: {
        userId,
        card: {
          subtopicId
        }
      },
      _avg: {
        easeFactor: true
      }
    });

    const averageEaseFactor = avgEaseResult._avg.easeFactor || 2.5;

    return {
      subtopicId,
      subtopicName: subtopic.name,
      cardsTotal,
      cardsLearned,
      cardsToReview,
      averageEaseFactor,
      ...subtopicMetrics
    };
  }

  async getOverallPerformance(userId: string): Promise<PerformanceMetrics & { contestsCount: number }> {
    const allStudySessions = await prisma.studySession.findMany({
      where: { userId },
      include: {
        card: {
          include: {
            subtopic: {
              include: {
                topic: {
                  include: {
                    contestTopics: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const overallMetrics = this.calculateMetrics(allStudySessions);

    // Count unique contests
    const contestIds = new Set(
      allStudySessions.map(session => 
        session.card.subtopic.topic.contestTopics.map(ct => ct.contestId)
      ).flat()
    );

    return {
      ...overallMetrics,
      contestsCount: contestIds.size
    };
  }

  private calculateMetrics(studySessions: any[]): PerformanceMetrics {
    if (studySessions.length === 0) {
      return {
        totalStudyTime: 0,
        totalReviews: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracy: 0,
        averageResponseTime: 0,
        streakDays: 0,
        lastStudyDate: null
      };
    }

    const totalReviews = studySessions.length;
    const correctAnswers = studySessions.filter(s => s.quality >= 3).length;
    const incorrectAnswers = totalReviews - correctAnswers;
    const accuracy = totalReviews > 0 ? (correctAnswers / totalReviews) * 100 : 0;

    // Calculate total study time (assuming each review takes some time)
    const totalStudyTime = studySessions.reduce((sum, session) => {
      return sum + (session.responseTime || 30); // Default 30 seconds if no response time
    }, 0);

    const averageResponseTime = totalStudyTime / totalReviews;

    // Calculate streak days
    const streakDays = this.calculateStreakDays(studySessions);

    // Get last study date
    const lastStudyDate = studySessions.length > 0 
      ? new Date(Math.max(...studySessions.map(s => new Date(s.reviewedAt).getTime())))
      : null;

    return {
      totalStudyTime,
      totalReviews,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      averageResponseTime,
      streakDays,
      lastStudyDate
    };
  }

  private async calculateTopicPerformance(
    userId: string, 
    contestTopics: any[], 
    allStudySessions: any[]
  ): Promise<TopicPerformance[]> {
    const topicPerformance: TopicPerformance[] = [];

    for (const contestTopic of contestTopics) {
      const topic = contestTopic.topic;
      const topicSessions = allStudySessions.filter(
        session => session.card.subtopic.topicId === topic.id
      );

      const topicMetrics = this.calculateMetrics(topicSessions);
      const subtopicPerformance = await this.calculateSubtopicPerformance(
        userId, 
        topic.subtopics, 
        topicSessions
      );

      topicPerformance.push({
        topicId: topic.id,
        topicName: topic.name,
        ...topicMetrics,
        subtopicPerformance
      });
    }

    return topicPerformance;
  }

  private async calculateSubtopicPerformance(
    userId: string, 
    subtopics: any[], 
    allStudySessions: any[]
  ): Promise<SubtopicPerformance[]> {
    const subtopicPerformance: SubtopicPerformance[] = [];

    for (const subtopic of subtopics) {
      const subtopicSessions = allStudySessions.filter(
        session => session.card.subtopicId === subtopic.id
      );

      const subtopicMetrics = this.calculateMetrics(subtopicSessions);

      // Calculate additional metrics
      const cardsTotal = subtopic.cards.length;
      const cardsLearned = new Set(
        subtopicSessions
          .filter(s => s.quality >= 3)
          .map(s => s.cardId)
      ).size;

      const cardsToReview = await prisma.card.count({
        where: {
          subtopicId: subtopic.id,
          studySessions: {
            some: {
              userId,
              nextReviewDate: {
                lte: new Date()
              }
            }
          }
        }
      });

      const avgEaseResult = await prisma.studySession.aggregate({
        where: {
          userId,
          card: {
            subtopicId: subtopic.id
          }
        },
        _avg: {
          easeFactor: true
        }
      });

      const averageEaseFactor = avgEaseResult._avg.easeFactor || 2.5;

      subtopicPerformance.push({
        subtopicId: subtopic.id,
        subtopicName: subtopic.name,
        cardsTotal,
        cardsLearned,
        cardsToReview,
        averageEaseFactor,
        ...subtopicMetrics
      });
    }

    return subtopicPerformance;
  }

  private calculateDailyProgress(studySessions: any[]): DailyProgress[] {
    const dailyData = new Map<string, DailyProgress>();

    studySessions.forEach(session => {
      const date = new Date(session.reviewedAt).toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          reviewsCount: 0,
          correctCount: 0,
          studyTimeMinutes: 0,
          newCardsLearned: 0
        });
      }

      const dayData = dailyData.get(date)!;
      dayData.reviewsCount++;
      if (session.quality >= 3) {
        dayData.correctCount++;
      }
      dayData.studyTimeMinutes += (session.responseTime || 30) / 60; // Convert to minutes
      
      // Count as new card learned if it's the first time with quality >= 3
      if (session.quality >= 3 && session.repetitions === 1) {
        dayData.newCardsLearned++;
      }
    });

    return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateDifficultyDistribution(studySessions: any[]): DifficultyStats[] {
    const difficultyMap = new Map<string, { count: number; correct: number }>();

    studySessions.forEach(session => {
      let difficulty: 'easy' | 'medium' | 'hard';
      
      // Determine difficulty based on ease factor
      if (session.easeFactor >= 2.8) {
        difficulty = 'easy';
      } else if (session.easeFactor >= 2.3) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }

      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, { count: 0, correct: 0 });
      }

      const stats = difficultyMap.get(difficulty)!;
      stats.count++;
      if (session.quality >= 3) {
        stats.correct++;
      }
    });

    return Array.from(difficultyMap.entries()).map(([difficulty, stats]) => ({
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      count: stats.count,
      accuracy: stats.count > 0 ? (stats.correct / stats.count) * 100 : 0
    }));
  }

  private calculateStreakDays(studySessions: any[]): number {
    if (studySessions.length === 0) return 0;

    // Group sessions by date
    const sessionsByDate = new Map<string, any[]>();
    studySessions.forEach(session => {
      const date = new Date(session.reviewedAt).toISOString().split('T')[0];
      if (!sessionsByDate.has(date)) {
        sessionsByDate.set(date, []);
      }
      sessionsByDate.get(date)!.push(session);
    });

    const dates = Array.from(sessionsByDate.keys()).sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (const date of dates) {
      const sessionDate = new Date(date);
      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate = sessionDate;
      } else if (daysDiff > streak + 1) {
        break;
      }
    }

    return streak;
  }
}

export const performanceAnalysisService = new PerformanceAnalysisService();

