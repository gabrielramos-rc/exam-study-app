// src/app/admin/exams/[examId]/import/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { ImportDropzone } from '@/components/import';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { ImportResult, ApiError } from '@/types';

interface ExamBasic {
  id: string;
  name: string;
  questionCount: number;
}

export default function ImportPage() {
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<ExamBasic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}`);

        if (!response.ok) {
          const errorData: ApiError = await response.json();
          setError(errorData.error.message);
          return;
        }

        const data = await response.json();
        setExam({
          id: data.id,
          name: data.name,
          questionCount: data.stats.totalQuestions,
        });
      } catch {
        setError('Failed to load exam details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleImportComplete = (result: ImportResult) => {
    // Refresh the exam data to get updated question count
    if (result.success && result.questionsImported > 0) {
      setExam(prev => prev ? {
        ...prev,
        questionCount: prev.questionCount + result.questionsImported,
      } : null);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (error || !exam) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/exams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Error</h1>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{error || 'Exam not found'}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/admin/exams">Back to Exams</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/exams/${examId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Questions</h1>
            <p className="text-muted-foreground">
              {exam.name} &bull; {exam.questionCount} existing questions
            </p>
          </div>
        </div>

        {/* Import Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Question Format
            </CardTitle>
            <CardDescription>
              Upload a ZIP file containing question files in Markdown (.md) or JSON (.json) format.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Your ZIP file should contain:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Question files (.md or .json) in the root or subdirectories</li>
              <li>Optional: An <code className="bg-muted px-1 rounded">/images/</code> folder for question images</li>
            </ul>
            <p className="mt-4">
              See the{' '}
              <Link href="/docs/question-format" className="text-primary hover:underline">
                Question Format Guide
              </Link>{' '}
              for detailed formatting instructions.
            </p>
          </CardContent>
        </Card>

        {/* Dropzone */}
        <ImportDropzone
          examId={examId}
          onImportComplete={handleImportComplete}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/exams/${examId}`}>
              Back to Exam
            </Link>
          </Button>
          {exam.questionCount > 0 && (
            <Button asChild>
              <Link href={`/study/${examId}`}>
                Start Studying
              </Link>
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
