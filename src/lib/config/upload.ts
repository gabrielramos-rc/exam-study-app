// src/lib/config/upload.ts

/**
 * Upload configuration constants
 */
export const UPLOAD_CONFIG = {
  /**
   * Maximum file size in bytes (50MB)
   * This should match UPLOAD_MAX_SIZE env var if set
   */
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  /**
   * Maximum file size in human-readable format
   */
  MAX_FILE_SIZE_DISPLAY: '50MB',

  /**
   * Accepted file types
   */
  ACCEPTED_TYPES: {
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
  },

  /**
   * Accepted file extensions (for display)
   */
  ACCEPTED_EXTENSIONS: ['.zip'],
} as const;

/**
 * Validates a file against upload constraints
 * @returns Error message if invalid, null if valid
 */
export function validateUploadFile(file: File): string | null {
  // Check file type
  const isZip = file.type === 'application/zip' ||
                file.type === 'application/x-zip-compressed' ||
                file.name.toLowerCase().endsWith('.zip');

  if (!isZip) {
    return 'Only ZIP files are accepted';
  }

  // Check file size
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return `File size must be less than ${UPLOAD_CONFIG.MAX_FILE_SIZE_DISPLAY}`;
  }

  return null;
}
