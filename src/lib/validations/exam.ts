// src/lib/validations/exam.ts
// Shared Zod schemas for exam validation (used by both frontend and API)

import { z } from 'zod';

/**
 * Base schema for exam validation (without transforms)
 * Used by react-hook-form for client-side validation
 */
export const examFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name cannot exceed 200 characters'),
  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
});

/**
 * Schema for creating a new exam (with transforms for API)
 * Transforms handle trimming and null coercion
 */
export const createExamSchema = examFormSchema.transform((data) => ({
  name: data.name.trim(),
  description: data.description?.trim() || null,
}));

/**
 * Schema for updating an existing exam
 */
export const updateExamSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(200, 'Name cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .nullable()
      .optional(),
  })
  .transform((data) => ({
    name: data.name?.trim(),
    description: data.description ? data.description.trim() : data.description,
  }));

// Inferred types for use in components and API handlers
export type ExamFormInput = z.infer<typeof examFormSchema>;
export type CreateExamData = z.output<typeof createExamSchema>;
export type UpdateExamInput = z.input<typeof updateExamSchema>;
export type UpdateExamData = z.output<typeof updateExamSchema>;
