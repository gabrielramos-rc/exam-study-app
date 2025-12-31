// src/types/import.ts

/**
 * Status of an import operation
 */
export type ImportStatus =
  | 'idle'           // No file selected
  | 'validating'     // Checking file
  | 'uploading'      // Sending to server
  | 'processing'     // Server is processing
  | 'completed'      // Successfully finished
  | 'error';         // Something went wrong

/**
 * Progress information during import
 */
export interface ImportProgress {
  /** Current status of the import */
  status: ImportStatus;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
  /** Processing progress message */
  processingMessage?: string;
  /** Number of items processed so far */
  processedCount?: number;
  /** Total number of items to process */
  totalCount?: number;
}

/**
 * Result of a completed import
 */
export interface ImportResult {
  /** Whether the import succeeded */
  success: boolean;
  /** Number of questions imported */
  questionsImported: number;
  /** Number of images copied */
  imagesCopied: number;
  /** Number of items skipped (with reasons) */
  skipped: Array<{
    file: string;
    reason: string;
  }>;
  /** Any errors encountered */
  errors: Array<{
    file: string;
    error: string;
  }>;
}

/**
 * State for the import dropzone component
 */
export interface ImportDropzoneState {
  /** Currently selected file */
  file: File | null;
  /** Validation error if any */
  validationError: string | null;
  /** Import progress */
  progress: ImportProgress;
  /** Import result after completion */
  result: ImportResult | null;
}
