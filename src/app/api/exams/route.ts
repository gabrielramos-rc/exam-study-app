// src/app/api/exams/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/exams - List all exams with stats
export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    // Get additional stats for each exam
    const examsWithStats = await Promise.all(
      exams.map(async (exam) => {
        // Count answered questions
        const answeredCount = await prisma.answer.count({
          where: {
            question: { examId: exam.id },
          },
        });

        // Calculate accuracy (only if there are answers)
        let accuracy = 0;
        if (answeredCount > 0) {
          const correctCount = await prisma.answer.count({
            where: {
              question: { examId: exam.id },
              correct: true,
            },
          });
          accuracy = Math.round((correctCount / answeredCount) * 100 * 10) / 10;
        }

        // Count due for review
        const dueForReview = await prisma.srsCard.count({
          where: {
            question: { examId: exam.id },
            nextReview: { lte: new Date() },
          },
        });

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
      })
    );

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
