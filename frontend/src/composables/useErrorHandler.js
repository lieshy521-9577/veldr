import { ref } from 'vue';
import { useToast } from 'vue-toastification';

/**
 * Global error handling composable
 * Provides consistent error handling across the application
 */
export function useErrorHandler() {
  const toast = useToast();
  const isHandlingError = ref(false);

  /**
   * Handle API errors with consistent messaging
   * @param {Error|Object} error - Error object or error response
   * @param {Object} options - Error handling options
   * @param {string} options.context - Context where error occurred
   * @param {boolean} options.showToast - Whether to show toast notification
   * @param {string} options.fallbackMessage - Fallback message if error message is not available
   * @param {Function} options.onError - Custom error handler
   */
  const handleError = (error, options = {}) => {
    const {
      context = 'Unknown',
      showToast = true,
      fallbackMessage = 'An unexpected error occurred',
      onError = null
    } = options;

    isHandlingError.value = true;

    // Extract error message
    let errorMessage = fallbackMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && error.message) {
      errorMessage = error.message;
    } else if (error && error.error) {
      errorMessage = error.error;
    }

    // Log error for debugging
    console.error(`[${context}] Error:`, error);

    // Show toast notification
    if (showToast) {
      toast.error(errorMessage);
    }

    // Call custom error handler if provided
    if (onError && typeof onError === 'function') {
      onError(error, errorMessage);
    }

    isHandlingError.value = false;

    return {
      message: errorMessage,
      originalError: error,
      context
    };
  };

  /**
   * Handle API response errors
   * @param {Response} response - Fetch response object
   * @param {Object} options - Error handling options
   */
  const handleApiError = async (response, options = {}) => {
    const {
      context = 'API',
      showToast = true,
      fallbackMessage = 'API request failed'
    } = options;

    let errorMessage = fallbackMessage;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || fallbackMessage;
    } catch {
      // If response is not JSON, use status text or fallback
      errorMessage = response.statusText || fallbackMessage;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;

    return handleError(error, { context, showToast, fallbackMessage });
  };

  /**
   * Handle network errors
   * @param {Error} error - Network error
   * @param {Object} options - Error handling options
   */
  const handleNetworkError = (error, options = {}) => {
    const {
      context = 'Network',
      showToast = true,
      fallbackMessage = 'Network connection failed'
    } = options;

    return handleError(error, { context, showToast, fallbackMessage });
  };

  /**
   * Handle validation errors
   * @param {Object} errors - Validation errors object
   * @param {Object} options - Error handling options
   */
  const handleValidationError = (errors, options = {}) => {
    const {
      context = 'Validation',
      showToast = true,
      fallbackMessage = 'Validation failed'
    } = options;

    // Convert validation errors to a single message
    let errorMessage = fallbackMessage;
    
    if (typeof errors === 'object' && errors !== null) {
      const errorMessages = Object.values(errors).filter(msg => msg && typeof msg === 'string');
      if (errorMessages.length > 0) {
        errorMessage = errorMessages.join(', ');
      }
    } else if (typeof errors === 'string') {
      errorMessage = errors;
    }

    return handleError(errorMessage, { context, showToast, fallbackMessage });
  };

  /**
   * Create an error boundary for async operations
   * @param {Function} asyncFn - Async function to wrap
   * @param {Object} options - Error handling options
   */
  const withErrorHandling = (asyncFn, options = {}) => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        return handleError(error, options);
      }
    };
  };

  /**
   * Clear all error states
   */
  const clearErrors = () => {
    isHandlingError.value = false;
  };

  return {
    isHandlingError,
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    withErrorHandling,
    clearErrors
  };
}
