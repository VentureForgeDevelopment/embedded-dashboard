import axios from 'axios'
import { config } from '../config/environment'

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true // Important for CSRF and session cookies
})

// Debug logging for API configuration
console.log('Dashboard API Instance Debug:', {
  'config.apiUrl': config.apiUrl,
  'config.csrfUrl': config.csrfUrl,
  'axios baseURL': api.defaults.baseURL
})

// Helper function to get CSRF token from cookie
function getCSRFToken() {
  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value)
    }
  }
  return null
}

// Initialize CSRF token on first request only
let csrfInitialized = false
const initializeCSRF = async () => {
  if (!csrfInitialized) {
    try {
      await axios.get(config.csrfUrl, { withCredentials: true })
      csrfInitialized = true
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error)
    }
  }
}

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (axiosConfig) => {
    // If a bearer token is present, this is a stateless API call (e.g., from WordPress).
    // We should not apply stateful CSRF logic to it.
    if (axiosConfig.headers.Authorization) {
      console.log('Dashboard API - Bearer token found, treating as stateless request.');
      axiosConfig.headers['X-Requested-With'] = 'XMLHttpRequest'; // Still good practice for Laravel
      return axiosConfig;
    }

    // --- If no Authorization header, proceed with stateful, session-based SPA authentication ---
    console.log('Dashboard API - No Bearer token, proceeding with stateful (CSRF) logic.');

    // Initialize CSRF token for the session if it hasn't been done yet.
    await initializeCSRF();

    // For stateful SPA authentication, we need to send the CSRF token on all requests
    // for Sanctum's stateful guard to work correctly, even for GET requests.
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      axiosConfig.headers['X-XSRF-TOKEN'] = csrfToken;
      console.log('Dashboard API - Added CSRF token to stateful request');
    } else {
      console.warn('Dashboard API - No CSRF token found for stateful request');
    }

    // Always add SPA headers for stateful authentication
    axiosConfig.headers['X-Requested-With'] = 'XMLHttpRequest';

    return axiosConfig;
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      const isEmbedded = !!window.WebLinguistDashboard

      if (!isEmbedded) {
        window.location.href = config.loginUrl
      }
      
    } else if (error.response?.status === 419 && !error.config._retry) {
      // CSRF token mismatch - try to refresh and retry once
      // Mark this request as already retried to prevent infinite loops
      error.config._retry = true
      
      try {
        // Reset CSRF initialization flag to force refresh
        csrfInitialized = false
        
        // Refresh CSRF token
        await axios.get(config.csrfUrl, {
          withCredentials: true
        })
        csrfInitialized = true
        
        // Get the new CSRF token and add to headers
        const csrfToken = getCSRFToken()
        if (csrfToken) {
          error.config.headers['X-XSRF-TOKEN'] = csrfToken
        }
        
        // Retry the original request
        return api.request(error.config)
      } catch (retryError) {
        console.error('Failed to refresh CSRF token:', retryError)
        // Return a user-friendly error message
        return Promise.reject({
          ...error,
          message: 'Authentication error. Please refresh the page and try again.',
          isCSRFError: true
        })
      }
    } else if (error.response?.status === 419 && error.config._retry) {
      // Already tried once, don't retry again
      console.error('CSRF token retry failed, giving up')
      return Promise.reject({
        ...error,
        message: 'Authentication error. Please refresh the page and try again.',
        isCSRFError: true
      })
    }
    return Promise.reject(error)
  }
)

// Cookie utility functions
export const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export const setCookie = (name, value, days = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

export const deleteCookie = (name) => {
  const hostnameParts = window.location.hostname.split('.')
  const domain = hostnameParts.length > 1 ? `domain=.${hostnameParts.slice(-2).join('.')};` : ''
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;${domain}path=/;SameSite=Lax`
}

export default api