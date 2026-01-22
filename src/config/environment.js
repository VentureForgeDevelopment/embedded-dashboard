// Environment configuration with production defaults
const getEnvironmentConfig = () => {
  const hostname = window.location.hostname

  // Determine environment based on hostname
  let environment = 'production'
  let developerPrefix = ''

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    environment = 'local'
  } else if (hostname.includes('.devp.weblinguist.ai')) {
    environment = 'development'
    if (hostname.includes('-alex.')) {
      developerPrefix = '-alex'
    } else if (hostname.includes('-ross.')) {
      developerPrefix = '-ross'
    }
  }

  // Build URLs based on environment
  let loginUrl, apiBaseUrl, dashboardUrl, registrationUrl, marketingHomepageUrl

  if (environment === 'local') {
    // Local development
    loginUrl = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5174/'
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/'
    dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8090/'
    registrationUrl = import.meta.env.VITE_REGISTRATION_URL || 'http://localhost:8090/'
  } else if (environment === 'development') {
    // Development environment with developer prefixes
    loginUrl = import.meta.env.VITE_LOGIN_URL || `https://login${developerPrefix}.devp.weblinguist.ai/`
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `https://api${developerPrefix}.devp.weblinguist.ai/`
    dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || `https://dashboard${developerPrefix}.devp.weblinguist.ai/`
    registrationUrl = import.meta.env.VITE_REGISTRATION_URL || `https://register${developerPrefix}.devp.weblinguist.ai/`
  } else {
    // Production environment (default)
    loginUrl = import.meta.env.VITE_LOGIN_URL || 'https://weblinguist.ai/login/'
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.weblinguist.ai/'
    dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'https://dashboard.weblinguist.ai/'
    registrationUrl = import.meta.env.VITE_REGISTRATION_URL || 'https://register.weblinguist.ai/'
  }

  marketingHomepageUrl = import.meta.env.VITE_MARKETING_HOMEPAGE_URL || 'https://weblinguist.ai/'

  const config = {
    environment,
    developerPrefix,
    loginUrl,
    dashboardUrl,
    apiBaseUrl,
    registrationUrl,
    marketingHomepageUrl,
    // Legacy compatibility - these build URLs from the base
    appApiUrl: `${apiBaseUrl}api/`,
    apiUrl: `${apiBaseUrl}vff-sso/`,
    billingApiUrl: `${apiBaseUrl}vff-billing/`,
    notificationApiUrl: `${apiBaseUrl}vff-notifications/`,
    csrfUrl: `${apiBaseUrl}sanctum/csrf-cookie`
  }

  // Debug logging
  console.log('Dashboard Environment Config Debug:', {
    hostname,
    environment,
    developerPrefix,
    apiBaseUrl,
    registrationUrl,
    apiUrl: config.apiUrl,
    csrfUrl: config.csrfUrl,
    'VITE_API_BASE_URL env var': import.meta.env.VITE_API_BASE_URL,
    'All VITE env vars': import.meta.env
  })

  return config
}

export const config = getEnvironmentConfig()

export default config