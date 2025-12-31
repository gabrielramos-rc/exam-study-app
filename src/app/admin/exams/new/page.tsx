// src/app/admin/exams/new/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { ExamForm } from '@/components/exam';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewExamPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Exam</h1>
            <p className="text-muted-foreground">
              Create a new certification exam.
            </p>
          </div>
        </div>

        <ExamForm onCancel={() => router.push('/admin/exams')} />
      </div>
    </MainLayout>
  );
}
