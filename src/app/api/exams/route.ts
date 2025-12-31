// src/app/api/exams/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/exams - List all exams with stats
export async function GET() {
  try {
    // Fetch all exams with question counts in a single query
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    // Get all exam IDs for batch queries
    const examIds = exams.map((exam) => exam.id);

    // Batch query: Get answer stats grouped by examId (answeredCount and correctCount)
    const answerStats = await prisma.answer.groupBy({
      by: ['questionId'],
      where: {
        question: { examId: { in: examIds } },
      },
      _count: { id: true },
    });

    // Fetch question to exam mapping for the answers we found
    const questionsWithAnswers = await prisma.question.findMany({
      where: { id: { in: answerStats.map((a) => a.questionId) } },
      select: { id: true, examId: true },
    });
    const questionToExam = new Map(questionsWithAnswers.map((q) => [q.id, q.examId]));

    // Batch query: Get correct answer counts grouped by questionId
    const correctStats = await prisma.answer.groupBy({
      by: ['questionId'],
      where: {
        question: { examId: { in: examIds } },
        correct: true,
      },
      _count: { id: true },
    });

    // Aggregate answer stats by examId
    const examAnswerStats = new Map<string, { answered: number; correct: number }>();
    for (const stat of answerStats) {
      const examId = questionToExam.get(stat.questionId);
      if (examId) {
        const current = examAnswerStats.get(examId) || { answered: 0, correct: 0 };
        current.answered += stat._count.id;
        examAnswerStats.set(examId, current);
      }
    }
    for (const stat of correctStats) {
      const examId = questionToExam.get(stat.questionId);
      if (examId) {
        const current = examAnswerStats.get(examId) || { answered: 0, correct: 0 };
        current.correct += stat._count.id;
        examAnswerStats.set(examId, current);
      }
    }

    // Batch query: Get due for review counts
    const dueCards = await prisma.srsCard.findMany({
      where: {
        question: { examId: { in: examIds } },
        nextReview: { lte: new Date() },
      },
      select: { question: { select: { examId: true } } },
    });

    // Aggregate due cards by examId
    const examDueCount = new Map<string, number>();
    for (const card of dueCards) {
      const examId = card.question.examId;
      examDueCount.set(examId, (examDueCount.get(examId) || 0) + 1);
    }

    // Build response with all stats
    const examsWithStats = exams.map((exam) => {
      const stats = examAnswerStats.get(exam.id) || { answered: 0, correct: 0 };
      const answeredCount = stats.answered;
      const accuracy =
        answeredCount > 0
          ? Math.round((stats.correct / answeredCount) * 100 * 10) / 10
          : 0;
      const dueForReview = examDueCount.get(exam.id) || 0;

      return {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        questionCount: exam._count.questions,
        answeredCount,
        accuracy,
        dueForReview,
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ exams: examsWithStats });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch exams',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create a new exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name is required and must be a string',
          },
        },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    if (name.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name cannot be empty',
          },
        },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name cannot exceed 200 characters',
          },
        },
        { status: 400 }
      );
    }

    const description = body.description?.trim() || null;
    if (description && description.length > 1000) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Description cannot exceed 1000 characters',
          },
        },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingExam = await prisma.exam.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingExam) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'An exam with this name already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the exam
    const exam = await prisma.exam.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(
      {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        createdAt: exam.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to create exam',
        },
      },
      { status: 500 }
    );
  }
}
