import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

/**
 * API Response Envelope (per FR-002-API)
 * All API responses are wrapped in this envelope structure
 */
export interface ApiEnvelope<T = any> {
  data?: T;
  error?: string | null;
  message?: string;
}

/**
 * API Error Response
 */
export interface ApiError {
  error: string;
  message?: string;
}

// Base URL configuration - use environment variable or default to /api/v1
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Retry configuration (T158)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Delay helper for retry logic
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Axios instance configured for the inventory API
 * - Enforces /api/v1/ prefix (FR-001-API)
 * - Handles response envelope unwrapping (FR-002-API)
 * - Implements retry logic for transient failures (T158)
 */
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

/**
 * Request interceptor - adds additional headers if needed
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any auth tokens here if needed in the future
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - unwraps envelope and handles errors
 * Per FR-002-API: All responses are in { data, error, message } format
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    // Unwrap the envelope and return the data directly
    // This allows consumers to use response.data directly without accessing response.data.data
    if (response.data && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error: AxiosError<ApiEnvelope>) => {
    // Retry logic for transient failures (T158)
    const config = error.config as InternalAxiosRequestConfig & { retryCount?: number };
    
    // Don't retry on client errors (4xx) or if we've exhausted retries
    const shouldRetry = 
      config &&
      (!error.response || error.response.status >= 500) &&
      (config.retryCount ?? 0) < MAX_RETRIES;

    if (shouldRetry) {
      config.retryCount = (config.retryCount ?? 0) + 1;
      
      // Exponential backoff: delay increases with each retry
      const retryDelay = RETRY_DELAY * Math.pow(2, config.retryCount - 1);
      
      return delay(retryDelay).then(() => apiClient.request(config));
    }
    
    // Extract error message from envelope if present
    if (error.response?.data) {
      const envelope = error.response.data;
      const errorMessage = envelope.error || envelope.message || 'An unexpected error occurred';
      
      // Create a standardized error object
      const apiError: ApiError = {
        error: errorMessage,
        message: envelope.message,
      };
      
      return Promise.reject({
        ...error,
        message: errorMessage,
        apiError,
      });
    }
    
    // Network or timeout error
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        ...error,
        message: 'Request timeout - please try again',
      });
    }
    
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: 'Network error - please check your connection',
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
