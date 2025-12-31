// src/components/exam/exam-card.tsx

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import type { ExamListItem } from '@/types';

interface ExamCardProps {
  exam: ExamListItem;
}

export function ExamCard({ exam }: ExamCardProps) {
  const hasQuestions = exam.questionCount > 0;
  const hasAnswers = exam.answeredCount > 0;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">
              <Link href={`/admin/exams/${exam.id}`} className="hover:underline">
                {exam.name}
              </Link>
            </CardTitle>
            {exam.description && (
              <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
            )}
          </div>
          {exam.dueForReview > 0 && (
            <Badge variant="secondary" className="ml-2">
              {exam.dueForReview} due
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{exam.questionCount} questions</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            <span>{exam.answeredCount} answered</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>{hasAnswers ? `${exam.accuracy}%` : '-'} accuracy</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{exam.dueForReview} to review</span>
          </div>
        </div>

        <div className="flex gap-2">
          {hasQuestions ? (
            <>
              <Button asChild size="sm">
                <Link href={`/study/${exam.id}`}>Study</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/exams/${exam.id}`}>Manage</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href={`/admin/exams/${exam.id}/import`}>Import Questions</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
