// src/app/api/exams/[examId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// GET /api/exams/[examId] - Get exam with stats
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Exam not found',
            details: { examId },
          },
        },
        { status: 404 }
      );
    }

    // Get answer stats using count queries (memory-efficient)
    const [answered, correct] = await Promise.all([
      prisma.answer.count({
        where: { question: { examId } },
      }),
      prisma.answer.count({
        where: { question: { examId }, correct: true },
      }),
    ]);

    const accuracy = answered > 0 ? Math.round((correct / answered) * 100 * 10) / 10 : 0;

    // Get due for review count
    const dueForReview = await prisma.srsCard.count({
      where: {
        question: { examId },
        nextReview: { lte: new Date() },
      },
    });

    // Get section breakdown using raw query for JSONB access
    const sectionStats = await prisma.$queryRaw<
      Array<{
        sectionId: string | null;
        section: string | null;
        total: bigint;
        correct: bigint;
      }>
    >`
      SELECT
        (q.data->>'sectionId') as "sectionId",
        (q.data->>'section') as section,
        COUNT(DISTINCT q.id)::bigint as total,
        COUNT(DISTINCT CASE WHEN a.correct = true THEN a.id END)::bigint as correct
      FROM "Question" q
      LEFT JOIN "Answer" a ON a."questionId" = q.id
      WHERE q."examId" = ${examId}
      GROUP BY (q.data->>'sectionId'), (q.data->>'section')
      ORDER BY (q.data->>'sectionId')
    `;

    const bySection = sectionStats.map((s) => ({
      sectionId: s.sectionId || 'Unknown',
      section: s.section || 'Unknown',
      total: Number(s.total),
      correct: Number(s.correct),
      accuracy: Number(s.total) > 0 ? Math.round((Number(s.correct) / Number(s.total)) * 100) : 0,
    }));

    return NextResponse.json({
      id: exam.id,
      name: exam.name,
      description: exam.description,
      stats: {
        totalQuestions: exam._count.questions,
        answered,
        correct,
        accuracy,
        dueForReview,
        bySection,
      },
      createdAt: exam.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch exam',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[examId] - Delete exam and all related data
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Exam not found',
            details: { examId },
          },
        },
        { status: 404 }
      );
    }

    // Get counts before deletion for response
    const questionIds = await prisma.question.findMany({
      where: { examId },
      select: { id: true },
    });
    const questionIdList = questionIds.map((q) => q.id);

    const answersCount = await prisma.answer.count({
      where: { questionId: { in: questionIdList } },
    });

    const srsCardsCount = await prisma.srsCard.count({
      where: { questionId: { in: questionIdList } },
    });

    // Delete exam (cascades to questions, answers, srsCards, bookmarks, studyProgress)
    await prisma.exam.delete({
      where: { id: examId },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        questions: exam._count.questions,
        answers: answersCount,
        srsCards: srsCardsCount,
      },
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to delete exam',
        },
      },
      { status: 500 }
    );
  }
}
