import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "../utils/api"
import { config } from "../config/environment"

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const currentAccountId = ref(null)
  const currentAccountRole = ref(null)
  const initialOnboardComplete = ref(false)
  const referrals = ref([])
  const payouts = ref([])
  const availableCommission = ref(0)

  // Identify which app is making the request.
  const appId = import.meta.env.VITE_APP_ID

  const appApiUrl = computed(() => config.appApiUrl)

  // Computed
  const userInitials = computed(() => {
    if (!user.value?.name) return "?"
    // Filter out empty strings that can result from multiple spaces
    const names = user.value.name.split(" ").filter((name) => name.length > 0)

    if (names.length === 0) {
      return "?" // Handle cases where the name is only spaces
    }

    if (names.length >= 2) {
      return (
        names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase()
      )
    }
    // For single names
    return names[0][0].toUpperCase()
  })

  // Actions
  const embeddedRegister = async (credentials) => {
    loading.value = true
    try {
      // Add the 'from' parameter for the backend to identify the registration source
      const payload = { ...credentials, from: "embedded" }
      const response = await api.post("users/register", payload)

      if (response.data.success) {
        const {
          token,
          user: userData,
          account,
          current_account_id,
          current_account_role,
        } = response.data

        // Store token in local storage for persistence across page reloads
        localStorage.setItem("authToken", token)

        // Set the authorization header for all subsequent api requests
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Update store state
        user.value = userData
        currentAccountId.value = current_account_id
        currentAccountRole.value = current_account_role
        isAuthenticated.value = true
        initialOnboardComplete.value = 0

        // After successful registration, send the long-lived token back to WordPress to be stored.
        const wpData = window.WebLinguistDashboard
        if (wpData && wpData.ajaxUrl && wpData.saveTokenNonce) {
          const formData = new FormData()
          formData.append("action", "webliaiw_save_auth_token")
          formData.append("token", token)
          formData.append("nonce", wpData.saveTokenNonce)

          fetch(wpData.ajaxUrl, {
            method: "POST",
            body: formData,
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("Token storage response from WordPress:", data)
            })
            .catch((e) =>
              console.error("Failed to save auth token to WordPress:", e)
            )
        }

        return response.data
      } else {
        throw new Error(response.data.message || "Embedded registration failed.")
      }
    } catch (err) {
      // Re-throw the error so the component can catch it and display a message
      throw err
    } finally {
      loading.value = false
    }
  }

  const embeddedLogin = async (credentials) => {
    loading.value = true
    try {
      const response = await api.post("user/embedded-login", credentials)

      if (response.data.success) {
        const {
          token,
          user: userData,
          account,
          current_account_id,
          current_account_role,
        } = response.data

        // Store token in local storage for persistence across page reloads
        localStorage.setItem("authToken", token)

        // Set the authorization header for all subsequent api requests
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Update store state
        user.value = userData
        currentAccountId.value = current_account_id
        currentAccountRole.value = current_account_role
        isAuthenticated.value = true
        initialOnboardComplete.value = account?.initial_onboard_complete != 0

        // After successful login, send the long-lived token back to WordPress to be stored.
        const wpData = window.WebLinguistDashboard
        if (wpData && wpData.ajaxUrl && wpData.saveTokenNonce) {
          const formData = new FormData()
          formData.append("action", "webliaiw_save_auth_token")
          formData.append("token", token)
          formData.append("nonce", wpData.saveTokenNonce)

          // Fire and forget this request. We don't need to block the user flow.
          // Error handling is done via console logging so it can be debugged if needed.
          fetch(wpData.ajaxUrl, {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Token storage response from WordPress:", data)
            })
            .catch((e) =>
              console.error("Failed to save auth token to WordPress:", e)
            )
        }

        return response.data
      } else {
        throw new Error(response.data.message || "Embedded login failed.")
      }
    } catch (err) {
      // Clear any potentially stale auth data
      localStorage.removeItem("authToken")
      delete api.defaults.headers.common["Authorization"]
      isAuthenticated.value = false
      user.value = null
      // Re-throw the error so the component can catch it and display a message
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkSession = async (embeddedObject = null) => {
    loading.value = true
    const isEmbedded = !!embeddedObject

    // Fallback to checking the URL for a token, for other flows like post-registration.
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get("token")

    console.log("Dashboard auth store - Starting session check...")
    try {
      let response

      // The Authorization header is set in main.js if a persistent token was passed from WordPress.
      // If embedded and the header exists, use a dedicated endpoint that validates the bearer token.
      // The header is also set by the embeddedLogin action.
      if (isEmbedded) {
        api.defaults.headers.common['Authorization'] = `Bearer ${embeddedObject?.ssoToken}`;

        response = await api.get("user/embedded-check")
      } else {
        // For the standalone app or initial SSO login (where a one-time token is in the URL).
        const config = {
          params: tokenFromUrl ? { token: tokenFromUrl } : {},
        }
        response = await api.get("user/check", config)
      }

      console.log(
        "Dashboard auth store - Session check response:",
        response.data
      )

      if (response.data.success === 1 || response.data.success === true) {
        user.value = response.data.user
        currentAccountId.value = response.data.current_account_id
        currentAccountRole.value = response.data.current_account_role
        isAuthenticated.value = true
        initialOnboardComplete.value =
          response.data.account?.initial_onboard_complete == 0 ? false : true

        console.log(
          "Dashboard auth store - Session check successful, user authenticated:",
          user.value.email
        )
        return true
      } else {
        console.log(
          "Dashboard auth store - Session check failed, success !== 1"
        )
        isAuthenticated.value = false
        user.value = null
        currentAccountId.value = null
        currentAccountRole.value = null
        return false
      }
    } catch (err) {
      console.error("Dashboard auth store - Session check error:", err)
      console.error(
        "Dashboard auth store - Error response:",
        err.response?.data
      )
      console.error(
        "Dashboard auth store - Error status:",
        err.response?.status
      )

      // User not authenticated
      isAuthenticated.value = false
      user.value = null
      currentAccountId.value = null
      currentAccountRole.value = null
    } finally {
      loading.value = false
      console.log("isAuthenticated check", isAuthenticated.value)
    }
    return false
  }

  const deleteCookie = (name) => {
    // To delete a cookie, you must set its expiration to the past.
    // It's crucial to specify the same path and domain as when the cookie was set.
    // We try deleting with and without the domain to be thorough.
    const domain = window.location.hostname
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    // Attempt to delete for the parent domain as well (e.g., .yourdomain.com)
    const parentDomain = domain.substring(domain.indexOf("."))
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${parentDomain};`
  }

  const logout = async () => {
    loading.value = true
    const isEmbedded = !!window.WebLinguistDashboard

    if (isEmbedded) {
      // Embedded Logout Flow
      try {
        // 1. Revoke the API token from the backend
        await api.get("user/embedded-logout")

        // 2. Clear the token from WordPress user meta
        const wpData = window.WebLinguistDashboard
        if (wpData && wpData.ajaxUrl && wpData.clearTokenNonce) {
          const formData = new FormData()
          formData.append("action", "webliaiw_clear_auth_token")
          formData.append("nonce", wpData.clearTokenNonce)

          await fetch(wpData.ajaxUrl, {
            method: "POST",
            body: formData,
          })
        }
      } catch (err) {
        console.error("Embedded logout error:", err)
        // Continue with client-side cleanup even if server calls fail
      } finally {
        // 3. Clear client-side authentication state
        localStorage.removeItem("authToken")
        delete api.defaults.headers.common["Authorization"]
        user.value = null
        isAuthenticated.value = false
        currentAccountId.value = null
        currentAccountRole.value = null
        loading.value = false

        // 4. Reload the page. The router guard will redirect to the embedded login.
        window.location.reload()
      }
    } else {
      // Standalone Logout Flow
      try {
        await api.get("user/logout")
      } catch (err) {
        console.error("Logout error:", err)
      } finally {
        user.value = null
        isAuthenticated.value = false
        currentAccountId.value = null
        currentAccountRole.value = null
        loading.value = false

        deleteCookie("XSRF-TOKEN")
        window.location.href = config.loginUrl
      }
    }
  }

  const getUserAccounts = async () => {
    try {
      const response = await api.get("/user/accounts")
      return response.data
    } catch (err) {
      console.error("Get accounts error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to get accounts",
      }
    }
  }

  const switchAccount = async (accountId) => {
    try {
      const response = await api.post("/user/switch-account", {
        account_id: accountId,
      })

      if (response.data.success) {
        // Update user data and current account context in store
        user.value = response.data.user
        currentAccountId.value = response.data.current_account_id
        currentAccountRole.value = response.data.current_account_role
      }

      return response.data
    } catch (err) {
      console.error("Switch account error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to switch account",
      }
    }
  }

  const getReferrals = async () => {
    try {
      const response = await api.get(appApiUrl.value + "user/get_referrals")

      if (response.data && response.data.success && response.data.referrals) {
        referrals.value = response.data.referrals
      }
    } catch (err) {
      console.error("Get referrals error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to get referrals",
      }
    }
  }

  const logReferral = async (payload) => {
    try {
      const response = await api.post(appApiUrl.value + "user/log_referral", {
        referrer_id: payload.referrer_id,
      })

      console.log("from logReferral", response.data)
      if (response.data.success) {
        console.log("referrer logged", response.data)
      }

      return response.data
    } catch (err) {
      console.error("Log referral error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to log referral",
      }
    }
  }

  const getPayouts = async () => {
    try {
      const response = await api.get(appApiUrl.value + "user/get_payouts")

      if (response.data && response.data.success && response.data.payouts) {
        payouts.value = response.data.payouts

        if (response.data.available_commission) {
          availableCommission.value = response.data.available_commission
        }
      }
    } catch (err) {
      console.error("Get payouts error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to get payouts",
      }
    }
  }

  const createPayout = async () => {
    try {
      const response = await api.post(appApiUrl.value + "user/create_payout")

      if (response.data.success) {
        availableCommission.value = 0
      }
      return response.data
    } catch (err) {
      console.error("Create payout error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to create payout",
      }
    }
  }

  const updatePaypalEmail = async (payload) => {
    try {
      const response = await api.post(
        appApiUrl.value + "user/update_paypal_email",
        {
          paypal_email: payload.email,
        }
      )

      return response.data
    } catch (err) {
      console.error("Update paypal email error:", err)
      return {
        success: false,
        error: err.response?.data?.error || "Failed to update paypal email",
      }
    }
  }

  // Social login redirects
  const linkWithGoogle = () => {
    window.location.href = `${config.apiUrl}user/google/redirect?app_id=${appId}&user_id=${user.value.id}`
  }

  const linkWithMicrosoft = () => {
    window.location.href = `${config.apiUrl}user/microsoft/redirect?app_id=${appId}&user_id=${user.value.id}`
  }

  // Check if user signed up through free registration flow
  const isFreeUser = computed(() => {
    const flags = user.value?.flags || []
    return flags.includes("free_signup")
  })

  return {
    // State
    user,
    isAuthenticated,
    loading,
    currentAccountId,
    currentAccountRole,
    initialOnboardComplete,
    referrals,
    availableCommission,
    payouts,

    // Computed
    userInitials,
    isFreeUser,

    // Actions
    embeddedRegister,
    embeddedLogin,
    checkSession,
    logout,
    getUserAccounts,
    switchAccount,
    getReferrals,
    getPayouts,
    logReferral,
    createPayout,
    updatePaypalEmail,
    linkWithGoogle,
    linkWithMicrosoft,
  }
})
