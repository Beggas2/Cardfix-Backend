import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionTier: 'free' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface Contest {
  id: string;
  userId: string;
  name: string;
  description?: string;
  editalFileId?: string;
  parsedEditalData?: string; // Alterado de 'any' para 'string'
  processingError?: string;
  isProcessing: boolean;
  targetDate?: Date;
  examDate?: string;
  selectedOffice?: string;
  noticeStorageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  priority?: number; // Adicionado
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  description?: string;
  priority?: number; // Adicionado
  estimatedCards?: number; // Adicionado
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  subtopicId: string;
  front: string;
  back: string;
  createdBy: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCard {
  id: string;
  userId: string;
  cardId: string;
  contestId: string;
  subtopicId?: string;
  nextReviewTime?: Date;
  repetitions: number;
  easeFactor: number;
  interval: number;
  lastReviewed?: Date;
  totalCorrectReviews: number;
  totalIncorrectReviews: number;
  nextReview?: Date;
  correctStreak: number;
  incorrectStreak: number;
  status: 'new' | 'learning' | 'review' | 'graduated';
  createdAt: Date;
  updatedAt: Date;
}

export interface ContestTopic {
  id: string;
  contestId: string;
  topicId: string;
  userId: string;
  priority?: number; // Adicionado
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface AuthRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateContestRequest {
  name: string;
  description?: string;
  targetDate?: string;
  examDate?: string;
  selectedOffice?: string;
}

export interface CreateCardRequest {
  subtopicId: string;
  front: string;
  back: string;
}

export interface ReviewCardRequest {
  cardId: string;
  quality: number; // 0-5 for SM-2 algorithm
}

export interface GenerateCardsRequest {
  subtopicId: string;
  contestId: string;
  count?: number;
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JWT Payload
export interface JwtPayload {
  id: string; // Alterado de userId para id
  email: string;
  subscriptionTier: 'free' | 'paid';
}

// File upload
export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  mimetype: string;
  url?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}


