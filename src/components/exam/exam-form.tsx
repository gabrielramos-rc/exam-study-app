// src/components/exam/exam-form.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { examFormSchema, type ExamFormInput } from '@/lib/validations/exam';
import type { ApiError } from '@/types';

interface ExamFormProps {
  onCancel: () => void;
}

export function ExamForm({ onCancel }: ExamFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamFormInput>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: ExamFormInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Schema handles trimming and null transformation
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        setServerError(errorData.error.message);
        return;
      }

      const result = await response.json();
      // Redirect to the exam detail page
      router.push(`/admin/exams/${result.id}`);
    } catch (err) {
      console.error('Failed to create exam:', err);
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Exam Details</CardTitle>
        <CardDescription>
          Enter the details for your new exam.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Exam Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              placeholder="e.g., GCP Professional Cloud Security Engineer"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="e.g., Practice questions for the GCP Security certification exam"
              rows={3}
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Exam
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
