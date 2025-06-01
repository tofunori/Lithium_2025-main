// frontend/src/services/errorHandling.ts
import { PostgrestError } from '@supabase/supabase-js';

export class ServiceError extends Error {
  constructor(
    message: string,
    public context: string,
    public originalError?: Error | PostgrestError
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const handleSupabaseError = (error: PostgrestError | null, context: string): void => {
  if (error) {
    console.error(`Supabase error in ${context}:`, error.message, `(Code: ${error.code})`, error.details);
    throw new ServiceError(`Database error in ${context}: ${error.message}`, context, error);
  }
};

export const handleStorageError = (error: Error | null, context: string): void => {
  if (error) {
    console.error(`Supabase Storage error in ${context}:`, error.message);
    throw new ServiceError(`Storage error in ${context}: ${error.message}`, context, error);
  }
};

export const getPathFromSupabaseUrl = (url: string): string | null => {
  try {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split('/');
    const objectSegmentIndex = pathSegments.findIndex(segment => segment === 'object');
    if (objectSegmentIndex !== -1 && pathSegments.length > objectSegmentIndex + 2) {
      return pathSegments.slice(objectSegmentIndex + 2).join('/');
    }
    console.warn(`Could not extract path from Supabase Storage URL structure: ${url}`);
    return null;
  } catch (e) {
    console.error(`Invalid URL provided to getPathFromSupabaseUrl: ${url}`, e);
    return null;
  }
};