/**
 * Platform Bridge — Abstracts token and license persistence across WordPress and Shopify.
 *
 * When the dashboard is embedded in a platform (WordPress or Shopify), tokens and
 * license data need to be saved back to the host platform. This module provides a
 * uniform API for both platforms.
 *
 * - WordPress: Uses AJAX calls to admin-ajax.php with nonces
 * - Shopify: Uses fetch calls to the Laravel bridge endpoints with session token JWT auth
 * - Standalone: All operations are no-ops (returns resolved promises)
 */

const config = () => window.WebLinguistDashboard

/**
 * Determine the current platform: 'shopify', 'wordpress', or null (standalone).
 */
export function getPlatform() {
  const c = config()
  if (!c?.isEmbedded) return null
  if (c.platform === "shopify") return "shopify"
  return "wordpress"
}

/**
 * Get the store/site hostname for the current platform.
 *
 * - WordPress: window.location.hostname (the wp-admin runs on the store domain)
 * - Shopify: WebLinguistDashboard.shopDomain (iframe hostname is the API server, not the store)
 * - Standalone: window.location.hostname
 *
 * @returns {string} The store hostname (e.g. "mystore.myshopify.com")
 */
export function getStoreDomain() {
  const c = config()
  if (c?.platform === "shopify" && c.shopDomain) {
    return c.shopDomain
  }
  return window.location.hostname
}

/**
 * Get a fresh Shopify session token (JWT) from App Bridge.
 * Used to authenticate bridge API calls.
 *
 * @returns {Promise<string>} The session token JWT
 */
async function getShopifySessionToken() {
  if (window.shopify?.idToken) {
    return window.shopify.idToken()
  }
  throw new Error("Shopify App Bridge not available")
}

/**
 * Build headers for Shopify bridge requests, including the session token JWT.
 *
 * @returns {Promise<Object>} Headers object with Content-Type, Authorization, and X-Shop-Domain
 */
async function getShopifyHeaders() {
  const c = config()
  const sessionToken = await getShopifySessionToken()
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${sessionToken}`,
    "X-Shop-Domain": c.shopDomain,
  }
}

/**
 * Save a WL bearer token to the host platform.
 *
 * @param {string} token - The Sanctum bearer token to persist
 * @returns {Promise}
 */
export async function saveTokenToPlatform(token) {
  const c = config()
  if (!c?.isEmbedded) return

  if (c.platform === "shopify") {
    try {
      const headers = await getShopifyHeaders()
      const res = await fetch(c.bridgeUrl + "/save-token", {
        method: "POST",
        headers,
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      console.log("Token storage response from Shopify:", data)
      return data
    } catch (e) {
      console.error("Failed to save auth token to Shopify:", e)
    }
    return
  }

  // WordPress (default)
  const fd = new FormData()
  fd.append("action", "webliaiw_save_auth_token")
  fd.append("token", token)
  fd.append("nonce", c.saveTokenNonce)

  return fetch(c.ajaxUrl, {
    method: "POST",
    body: fd,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Token storage response from WordPress:", data)
      return data
    })
    .catch((e) => {
      console.error("Failed to save auth token to WordPress:", e)
    })
}

/**
 * Clear the WL bearer token from the host platform.
 *
 * @returns {Promise}
 */
export async function clearTokenFromPlatform() {
  const c = config()
  if (!c?.isEmbedded) return

  if (c.platform === "shopify") {
    try {
      const headers = await getShopifyHeaders()
      await fetch(c.bridgeUrl + "/clear-token", {
        method: "POST",
        headers,
      })
    } catch (e) {
      console.error("Failed to clear auth token from Shopify:", e)
    }
    return
  }

  // WordPress (default)
  if (!c.ajaxUrl || !c.clearTokenNonce) return

  const fd = new FormData()
  fd.append("action", "webliaiw_clear_auth_token")
  fd.append("nonce", c.clearTokenNonce)

  return fetch(c.ajaxUrl, {
    method: "POST",
    body: fd,
  }).catch((e) => {
    console.error("Failed to clear auth token from WordPress:", e)
  })
}

/**
 * Save license data (key, ID, subscription ID) to the host platform.
 *
 * @param {Object} payload - { license_id, license_key, subscription_id }
 * @returns {Promise}
 */
export async function saveLicenseToPlatform(payload) {
  const c = config()
  if (!c?.isEmbedded) {
    throw new Error("Not in embedded mode.")
  }

  const { license_id, license_key, subscription_id } = payload

  if (c.platform === "shopify") {
    const headers = await getShopifyHeaders()
    const response = await fetch(c.bridgeUrl + "/save-license", {
      method: "POST",
      headers,
      body: JSON.stringify({ license_id, license_key, subscription_id }),
    })

    if (!response.ok) {
      throw new Error("Network response was not ok")
    }

    const data = await response.json()
    if (data.success) {
      console.log("Successfully saved license to Shopify.", data.message)
    } else {
      throw new Error(data.message || "Failed to save license to Shopify.")
    }
    return data
  }

  // WordPress (default)
  return new Promise((resolve, reject) => {
    const { ajaxUrl, saveLicenseKeyNonce } = c

    if (!ajaxUrl || !saveLicenseKeyNonce) {
      return reject(new Error("Missing WordPress AJAX configuration."))
    }

    const formData = new FormData()
    formData.append("action", "webliaiw_save_license_key")
    formData.append("nonce", saveLicenseKeyNonce)
    formData.append("license_id", license_id)
    formData.append("license_key", license_key)
    formData.append("subscription_id", subscription_id || "")

    fetch(ajaxUrl, {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          console.log(
            "Successfully saved license to WordPress.",
            data.data.message
          )
          resolve(data)
        } else {
          throw new Error(
            data.data.message || "Failed to save license to WordPress."
          )
        }
      })
      .catch((error) => {
        console.error("Error saving license to platform:", error)
        reject(error)
      })
  })
}
