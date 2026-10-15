/**
 * Frontend Error Handling Utilities
 * Provides consistent error handling and user-friendly messages
 */

// Error message mappings
const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: 'Please log in to continue',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again',
  INVALID_TOKEN: 'Invalid authentication. Please log in again',
  FORBIDDEN: 'You do not have permission to perform this action',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_JSON: 'Invalid data format',
  MISSING_REQUIRED: 'Please fill in all required fields',
  
  // Database errors
  DUPLICATE_ENTRY: 'A record with this value already exists',
  INVALID_REFERENCE: 'Referenced record does not exist',
  REFERENCED_RECORD: 'Cannot delete: This record is being used elsewhere',
  NOT_FOUND: 'The requested resource was not found',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection',
  TIMEOUT: 'Request timed out. Please try again',
  
  // Generic errors
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again',
  ROUTE_NOT_FOUND: 'The requested page or resource was not found'
}

// User-friendly field name mappings
const FIELD_LABELS = {
  email: 'Email address',
  password: 'Password',
  current_password: 'Current password',
  new_password: 'New password',
  confirm_password: 'Password confirmation',
  name: 'Name',
  title: 'Title',
  description: 'Description',
  start_date: 'Start date',
  end_date: 'End date',
  period_id: 'Evaluation period',
  teacher_id: 'Teacher',
  student_id: 'Student',
  subject_id: 'Subject',
  department_id: 'Department',
  questionnaire_id: 'Questionnaire',
  evaluator_type: 'Evaluator type',
  semester: 'Semester',
  school_year: 'School year'
}

/**
 * Extract error message from API response
 * @param {Error|Object} error - Axios error or custom error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  // Network errors (no response from server)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT
    }
    if (error.message === 'Network Error' || !navigator.onLine) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }
    return error.message || ERROR_MESSAGES.INTERNAL_ERROR
  }

  const { data, status } = error.response

  // Extract error code and message from response
  const errorCode = data?.code
  const errorMessage = data?.message
  const errorField = data?.field

  // Use predefined message if available
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    let message = ERROR_MESSAGES[errorCode]
    
    // Add field information if available
    if (errorField && FIELD_LABELS[errorField]) {
      message = `${FIELD_LABELS[errorField]}: ${message}`
    }
    
    return message
  }

  // Use server message if available
  if (errorMessage) {
    return errorMessage
  }

  // Fallback to status-based messages
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input'
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED
    case 403:
      return ERROR_MESSAGES.FORBIDDEN
    case 404:
      return ERROR_MESSAGES.NOT_FOUND
    case 409:
      return ERROR_MESSAGES.DUPLICATE_ENTRY
    case 422:
      return ERROR_MESSAGES.VALIDATION_ERROR
    case 500:
      return ERROR_MESSAGES.INTERNAL_ERROR
    case 503:
      return 'Service temporarily unavailable. Please try again later'
    default:
      return ERROR_MESSAGES.INTERNAL_ERROR
  }
}

/**
 * Extract validation errors from API response
 * @param {Object} error - Axios error object
 * @returns {Object} Field-specific error messages
 */
export function getValidationErrors(error) {
  const errors = {}
  
  if (!error.response?.data) {
    return errors
  }

  const { data } = error.response

  // Single field error
  if (data.field && data.message) {
    const fieldLabel = FIELD_LABELS[data.field] || data.field
    errors[data.field] = data.message.replace(data.field, fieldLabel)
  }

  // Multiple field errors (if backend sends array)
  if (Array.isArray(data.errors)) {
    data.errors.forEach(err => {
      if (err.field && err.message) {
        const fieldLabel = FIELD_LABELS[err.field] || err.field
        errors[err.field] = err.message.replace(err.field, fieldLabel)
      }
    })
  }

  return errors
}

/**
 * Check if error is authentication-related
 * @param {Object} error - Axios error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  if (!error.response) return false
  
  const status = error.response.status
  const code = error.response.data?.code
  
  return status === 401 || 
         code === 'UNAUTHORIZED' || 
         code === 'TOKEN_EXPIRED' || 
         code === 'INVALID_TOKEN'
}

/**
 * Handle API error with toast notification
 * @param {Error} error - Error object
 * @param {Function} toast - Toast notification function
 * @param {string} fallbackMessage - Custom fallback message
 */
export function handleApiError(error, toast, fallbackMessage = null) {
  const message = getErrorMessage(error)
  
  if (toast && typeof toast.error === 'function') {
    toast.error(fallbackMessage || message)
  } else {
    console.error('[API Error]', message, error)
  }
  
  // Auto-redirect to login on auth errors
  if (isAuthError(error) && window.location.pathname !== '/login') {
    setTimeout(() => {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }, 1500)
  }
}

/**
 * Validate form data before submission
 * @param {Object} data - Form data
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result { valid: boolean, errors: {} }
 */
export function validateForm(data, requiredFields = []) {
  const errors = {}
  
  requiredFields.forEach(field => {
    const value = data[field]
    const fieldLabel = FIELD_LABELS[field] || field
    
    if (value === undefined || value === null || value === '') {
      errors[field] = `${fieldLabel} is required`
    }
  })
  
  // Email validation
  if (data.email && typeof data.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.email = 'Invalid email format'
    }
  }
  
  // Password validation
  if (data.password && data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }
  
  // Password confirmation
  if (data.confirm_password && data.password !== data.confirm_password) {
    errors.confirm_password = 'Passwords do not match'
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Log error for debugging (respects environment)
 * @param {string} context - Error context
 * @param {Error} error - Error object
 */
export function logError(context, error) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    })
  }
}

/**
 * Create retry handler for failed requests
 * @param {Function} requestFn - Function that makes the API request
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise}
 */
export async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status < 500) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
    }
  }
  
  throw lastError
}

export default {
  getErrorMessage,
  getValidationErrors,
  isAuthError,
  handleApiError,
  validateForm,
  logError,
  retryRequest
}
