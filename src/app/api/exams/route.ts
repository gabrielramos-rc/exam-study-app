// src/app/api/exams/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createExamSchema } from '@/lib/validations/exam';

// GET /api/exams - List all exams with stats
// Uses a single aggregated query to avoid N+1 performance issues
export async function GET() {
  try {
    // Single query to get all exams with their stats using raw SQL
    const examsWithStats = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        questionCount: bigint;
        answeredCount: bigint;
        correctCount: bigint;
        dueForReview: bigint;
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT
        e.id,
        e.name,
        e.description,
        COUNT(DISTINCT q.id)::bigint as "questionCount",
        COUNT(DISTINCT a.id)::bigint as "answeredCount",
        COUNT(DISTINCT CASE WHEN a.correct = true THEN a.id END)::bigint as "correctCount",
        COUNT(DISTINCT CASE WHEN s."nextReview" <= NOW() THEN s.id END)::bigint as "dueForReview",
        e."createdAt",
        e."updatedAt"
      FROM "Exam" e
      LEFT JOIN "Question" q ON q."examId" = e.id
      LEFT JOIN "Answer" a ON a."questionId" = q.id
      LEFT JOIN "SrsCard" s ON s."questionId" = q.id
      GROUP BY e.id, e.name, e.description, e."createdAt", e."updatedAt"
      ORDER BY e."createdAt" DESC
    `;

    const exams = examsWithStats.map((exam) => {
      const answeredCount = Number(exam.answeredCount);
      const correctCount = Number(exam.correctCount);
      return {
        id: exam.id,
        name: exam.name,
        description: exam.description,
        questionCount: Number(exam.questionCount),
        answeredCount,
        accuracy:
          answeredCount > 0
            ? Math.round((correctCount / answeredCount) * 100 * 10) / 10
            : 0,
        dueForReview: Number(exam.dueForReview),
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ exams });
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

    // Validate request body using shared Zod schema
    const parseResult = createExamSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: issues[0]?.message ?? 'Validation failed',
            details: issues,
          },
        },
        { status: 400 }
      );
    }

    const { name, description } = parseResult.data;

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
