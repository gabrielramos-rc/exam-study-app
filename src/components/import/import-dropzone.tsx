// src/components/import/import-dropzone.tsx

'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UPLOAD_CONFIG, validateUploadFile } from '@/lib/config/upload';
import {
  Upload,
  FileArchive,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { ImportDropzoneState, ImportProgress, ImportResult } from '@/types';
import { cn } from '@/lib/utils';

interface ImportDropzoneProps {
  examId: string;
  onImportComplete?: (result: ImportResult) => void;
  disabled?: boolean;
}

const initialProgress: ImportProgress = {
  status: 'idle',
  uploadProgress: 0,
};

export function ImportDropzone({
  examId,
  onImportComplete,
  disabled = false
}: ImportDropzoneProps) {
  const [state, setState] = useState<ImportDropzoneState>({
    file: null,
    validationError: null,
    progress: initialProgress,
    result: null,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Reset state
    setState({
      file: null,
      validationError: null,
      progress: initialProgress,
      result: null,
    });

    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    const error = validateUploadFile(file);

    if (error) {
      setState(prev => ({
        ...prev,
        validationError: error,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      file,
      validationError: null,
    }));
  }, []);

  const onDropRejected = useCallback(() => {
    setState(prev => ({
      ...prev,
      validationError: `Only ZIP files up to ${UPLOAD_CONFIG.MAX_FILE_SIZE_DISPLAY} are accepted`,
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: UPLOAD_CONFIG.ACCEPTED_TYPES,
    maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
    disabled: disabled || state.progress.status === 'uploading' || state.progress.status === 'processing',
  });

  const handleRemoveFile = () => {
    setState({
      file: null,
      validationError: null,
      progress: initialProgress,
      result: null,
    });
  };

  const handleUpload = async () => {
    if (!state.file) return;

    setState(prev => ({
      ...prev,
      progress: {
        status: 'uploading',
        uploadProgress: 0,
      },
    }));

    try {
      const formData = new FormData();
      formData.append('file', state.file);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<ImportResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                uploadProgress: progress,
              },
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Update to processing state when upload completes
            setState(prev => ({
              ...prev,
              progress: {
                status: 'processing',
                uploadProgress: 100,
                processingMessage: 'Processing ZIP file...',
              },
            }));

            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error?.message || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });

        xhr.open('POST', `/api/exams/${examId}/import`);
        xhr.send(formData);
      });

      const result = await uploadPromise;

      setState(prev => ({
        ...prev,
        progress: {
          status: 'completed',
          uploadProgress: 100,
        },
        result,
      }));

      onImportComplete?.(result);
    } catch (error) {
      setState(prev => ({
        ...prev,
        progress: {
          status: 'error',
          uploadProgress: 0,
        },
        validationError: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  const handleReset = () => {
    setState({
      file: null,
      validationError: null,
      progress: initialProgress,
      result: null,
    });
  };

  const isUploading = state.progress.status === 'uploading' || state.progress.status === 'processing';
  const isComplete = state.progress.status === 'completed';
  const hasError = state.progress.status === 'error' || state.validationError;

  // Completed state
  if (isComplete && state.result) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p className="text-muted-foreground">
                {state.result.questionsImported} questions imported
                {state.result.imagesCopied > 0 && `, ${state.result.imagesCopied} images copied`}
              </p>
            </div>

            {state.result.skipped.length > 0 && (
              <div className="w-full max-w-md text-left">
                <p className="text-sm font-medium text-yellow-500 mb-2">
                  {state.result.skipped.length} items skipped:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {state.result.skipped.slice(0, 3).map((item, i) => (
                    <li key={i} className="truncate">
                      &bull; {item.file}: {item.reason}
                    </li>
                  ))}
                  {state.result.skipped.length > 3 && (
                    <li>&bull; ... and {state.result.skipped.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {state.result.errors.length > 0 && (
              <div className="w-full max-w-md text-left">
                <p className="text-sm font-medium text-destructive mb-2">
                  {state.result.errors.length} errors:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {state.result.errors.slice(0, 3).map((item, i) => (
                    <li key={i} className="truncate">
                      &bull; {item.file}: {item.error}
                    </li>
                  ))}
                  {state.result.errors.length > 3 && (
                    <li>&bull; ... and {state.result.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <Button onClick={handleReset} variant="outline">
              Import More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Uploading/Processing state
  if (isUploading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">
                {state.progress.status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </h3>
              <p className="text-muted-foreground">
                {state.progress.status === 'uploading'
                  ? `${state.progress.uploadProgress}% uploaded`
                  : state.progress.processingMessage || 'Processing ZIP file...'}
              </p>
            </div>
            <Progress value={state.progress.uploadProgress} className="w-full max-w-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // File selected state
  if (state.file) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <FileArchive className="h-12 w-12 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">{state.file.name}</h3>
              <p className="text-muted-foreground">
                {(state.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload &amp; Import
              </Button>
              <Button variant="outline" onClick={handleRemoveFile}>
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default dropzone state
  return (
    <Card>
      <CardContent className="py-8">
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center',
            'border-2 border-dashed rounded-lg p-8',
            'cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            hasError && 'border-destructive',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />

          {hasError ? (
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          )}

          <h3 className="text-lg font-semibold mb-1">
            {isDragActive ? 'Release to upload' : 'Drop ZIP file here'}
          </h3>

          <p className="text-muted-foreground text-sm mb-4">
            or click to browse
          </p>

          {state.validationError && (
            <p className="text-destructive text-sm mb-4">
              {state.validationError}
            </p>
          )}

          <div className="text-xs text-muted-foreground space-y-1 text-center">
            <p>Supported formats: Markdown (.md), JSON (.json)</p>
            <p>Maximum file size: {UPLOAD_CONFIG.MAX_FILE_SIZE_DISPLAY}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
