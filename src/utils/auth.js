// src/utils/auth.js

/**
 * Retrieves the CSRF token from the browser's cookies.
 * @returns {string|null} The CSRF token, or null if not found.
 */
export const getCSRFToken = () => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  return token ? decodeURIComponent(token) : null;
};
