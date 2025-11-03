import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Centralized error handler for API calls and general errors
 * Provides consistent error handling across the application
 */

interface ErrorOptions {
  showToast?: boolean;
  customMessage?: string;
  logError?: boolean;
}

/**
 * Handle API errors with consistent formatting and user feedback
 * @param error - The error object (usually from axios or a thrown error)
 * @param options - Configuration options for error handling
 * @returns void - throws the error after handling
 */
export function handleApiError(
  error: unknown,
  options: ErrorOptions = {}
): never {
  const {
    showToast = true,
    customMessage = 'An error occurred',
    logError = true
  } = options;

  let errorMessage = customMessage;

  // Handle axios errors
  if (axios.isAxiosError(error)) {
    errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || customMessage;

    // Add status code context for debugging
    if (error.response?.status) {
      if (logError) {
        console.error(`API Error (${error.response.status}):`, errorMessage, error.response.data);
      }
    } else {
      if (logError) {
        console.error('API Error (Network):', errorMessage);
      }
    }
  }
  // Handle standard Error objects
  else if (error instanceof Error) {
    errorMessage = error.message || customMessage;
    if (logError) {
      console.error('Error:', errorMessage, error);
    }
  }
  // Handle unknown error types
  else {
    if (logError) {
      console.error('Unknown error:', error);
    }
  }

  // Show toast notification if enabled
  if (showToast) {
    toast.error(errorMessage);
  }

  // Re-throw the error for caller to handle if needed
  throw error;
}

/**
 * Handle API success with optional toast notification
 * @param message - Success message to display
 * @param showToast - Whether to show a toast notification
 */
export function handleApiSuccess(message: string, showToast: boolean = true): void {
  if (showToast) {
    toast.success(message);
  }
}

/**
 * Wrapper for async API calls with built-in error handling
 * @param apiCall - The async function to execute
 * @param errorMessage - Custom error message
 * @param successMessage - Optional success message
 * @returns The result of the API call
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'An error occurred',
  successMessage?: string
): Promise<T> {
  try {
    const result = await apiCall();
    if (successMessage) {
      handleApiSuccess(successMessage);
    }
    return result;
  } catch (error) {
    handleApiError(error, { customMessage: errorMessage });
  }
}
