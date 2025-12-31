// src/app/api/exams/[examId]/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ examId: string }>;
}

// POST /api/exams/[examId]/import - Import questions from ZIP
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { examId } = await params;

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
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

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file provided',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const isZip = file.type === 'application/zip' ||
                  file.type === 'application/x-zip-compressed' ||
                  file.name.toLowerCase().endsWith('.zip');

    if (!isZip) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Only ZIP files are accepted',
          },
        },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'File size must be less than 50MB',
          },
        },
        { status: 400 }
      );
    }

    // TODO: Implement actual parsing in Task 2.3-2.4
    // For now, return a placeholder response

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      questionsImported: 0,
      imagesCopied: 0,
      skipped: [
        {
          file: 'placeholder',
          reason: 'Import parsing not yet implemented (Task 2.3-2.4)',
        },
      ],
      errors: [],
    });
  } catch (error) {
    console.error('Error processing import:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process import',
        },
      },
      { status: 500 }
    );
  }
}
