// src/types/index.ts

export * from './exam';
export * from './import';

/**
 * Question data stored as JSONB in the database
 */
export interface QuestionData {
  // Core content
  text: string;
  options: Record<string, string>;
  correct: string[];

  // Explanation
  explanation: string;
  whyWrong?: Record<string, string>;

  // Metadata
  section?: string;
  sectionId?: string;
  tags?: string[];
  confidence?: 'high' | 'medium' | 'low';

  // Media
  imageUrl?: string;

  // Source
  sourceUrl?: string;
}

/**
 * Progress data stored as JSONB for export/import
 */
export interface ProgressData {
  version: string;
  exportedAt: string;
  examId: string;

  answers: {
    questionNumber: number;
    selected: string[];
    correct: boolean;
    timeSpentMs: number;
    answeredAt: string;
  }[];

  srsCards: {
    questionNumber: number;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReview: string;
    lastGrade: number;
  }[];

  bookmarks: {
    questionNumber: number;
    createdAt: string;
  }[];
}

/**
 * SM-2 algorithm input parameters
 */
export interface SM2Input {
  grade: number; // 0-5
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

/**
 * SM-2 algorithm output
 */
export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReview: Date;
}
