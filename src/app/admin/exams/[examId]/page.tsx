// src/app/admin/exams/[examId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { DeleteExamDialog } from '@/components/exam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  BarChart3,
  Clock,
  Upload,
  Play,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { ExamDetailResponse, ApiError } from '@/types';

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<ExamDetailResponse | null>(null);
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

        const data: ExamDetailResponse = await response.json();
        setExam(data);
      } catch {
        setError('Failed to load exam details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleDeleted = () => {
    router.push('/admin/exams');
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

  const hasQuestions = exam.stats.totalQuestions > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/exams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{exam.name}</h1>
              {exam.description && (
                <p className="text-muted-foreground mt-1">{exam.description}</p>
              )}
            </div>
          </div>
          <DeleteExamDialog
            examId={exam.id}
            examName={exam.name}
            questionCount={exam.stats.totalQuestions}
            onDeleted={handleDeleted}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.stats.totalQuestions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answered</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.stats.answered}</div>
              <p className="text-xs text-muted-foreground">
                {exam.stats.correct} correct
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exam.stats.answered > 0 ? `${exam.stats.accuracy}%` : '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.stats.dueForReview}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>
              {hasQuestions
                ? 'Start studying or import more questions.'
                : 'Import questions to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            {hasQuestions && (
              <Button asChild>
                <Link href={`/study/${exam.id}`}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Study
                </Link>
              </Button>
            )}
            <Button variant={hasQuestions ? 'outline' : 'default'} disabled>
              <Upload className="mr-2 h-4 w-4" />
              Import Questions
            </Button>
            <p className="text-sm text-muted-foreground self-center">
              Import will be available in Task 2.2-2.4
            </p>
          </CardContent>
        </Card>

        {/* Section Breakdown */}
        {exam.stats.bySection.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance by Section</CardTitle>
              <CardDescription>
                Your accuracy breakdown by exam section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exam.stats.bySection.map((section) => (
                  <div key={section.sectionId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {section.sectionId} - {section.section}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={section.accuracy < 60 ? 'destructive' : 'secondary'}>
                          {section.accuracy}%
                        </Badge>
                        <span className="text-muted-foreground">
                          ({section.correct}/{section.total})
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          section.accuracy < 60 ? 'bg-destructive' : 'bg-primary'
                        }`}
                        style={{ width: `${section.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty Questions State */}
        {!hasQuestions && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No questions yet</CardTitle>
              <CardDescription className="text-center mb-4">
                Import questions from a ZIP file to start studying.
              </CardDescription>
              <Button disabled>
                <Upload className="mr-2 h-4 w-4" />
                Import Questions
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Available in Task 2.2-2.4
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
