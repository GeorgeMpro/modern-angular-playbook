export const ERROR_URL = '/api/test';

export const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Bad Request (Validation Error)',
  401: 'Unauthorized (Session Expired)',
  403: 'Forbidden (Access Denied)',
  404: 'Not Found (Resource Missing)',
  500: 'Internal Server Error (Server Error)',
  0: 'Connection Error (Offline/Network Failure)',
}

export const USER_ERROR_MESSAGES: Record<number, string> = {
  0: 'Unable to connect. Please check your internet connection.',
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You don\'t have permission to access this resource.',
  404: 'The requested resource was not found.',
  429: 'Too many requests. Please slow down.',
  500: 'Server error. Our team has been notified.',
  503: 'Service temporarily unavailable. Please try again later.'
};

export const GLOBAL_ERROR_DESCRIPTIONS: Record<string, () => void> = {
  'JS Error': () => {
    throw new Error('Regular JS error')
  },
  'Type Error': () => {
    const x = null as any;
    x.property
  },
  'Async Error': () => {
    setTimeout(() => {
      throw new Error('Async error')
    })
  }
}
