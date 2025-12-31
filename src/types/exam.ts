// src/types/exam.ts

// Response type for GET /api/exams (list)
export interface ExamListItem {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
  answeredCount: number;
  accuracy: number;
  dueForReview: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamListResponse {
  exams: ExamListItem[];
}

// Request type for POST /api/exams
export interface CreateExamRequest {
  name: string;
  description?: string;
}

// Response type for POST /api/exams
export interface CreateExamResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

// Response type for GET /api/exams/[examId]
export interface ExamDetailResponse {
  id: string;
  name: string;
  description: string | null;
  stats: {
    totalQuestions: number;
    answered: number;
    correct: number;
    accuracy: number;
    dueForReview: number;
    bySection: Array<{
      sectionId: string;
      section: string;
      total: number;
      correct: number;
      accuracy: number;
    }>;
  };
  createdAt: string;
}

// Response type for DELETE /api/exams/[examId]
export interface DeleteExamResponse {
  success: boolean;
  deleted: {
    questions: number;
    answers: number;
    srsCards: number;
  };
}

// API Error response
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
