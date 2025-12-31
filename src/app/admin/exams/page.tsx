// src/app/admin/exams/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { ExamCard } from '@/components/exam';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { ExamListItem, ExamListResponse, ApiError } from '@/types';

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exams', { signal });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        setError(errorData.error.message);
        return;
      }

      const data: ExamListResponse = await response.json();
      setExams(data.exams);
    } catch (err) {
      // Ignore abort errors - component was unmounted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch exams:', err);
      setError('Failed to load exams. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchExams(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
            <p className="text-muted-foreground">
              Manage your certification exams.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/exams/new">
              <Plus className="mr-2 h-4 w-4" />
              New Exam
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CardTitle className="mb-2 text-destructive">Error</CardTitle>
              <CardDescription className="text-center mb-4">{error}</CardDescription>
              <Button variant="outline" onClick={() => fetchExams()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && exams.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No exams yet</CardTitle>
              <CardDescription className="text-center mb-4">
                Create your first exam to start importing questions.
              </CardDescription>
              <Button asChild>
                <Link href="/admin/exams/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Exam List */}
        {!isLoading && !error && exams.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
