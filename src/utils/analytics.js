/**
 * Reports a conversion event to Google Analytics.
 *
 * @param {object} options - The conversion options.
 * @param {string} [options.url] - The URL to redirect to after the conversion is sent.
 * @param {string|number} [options.transaction_id] - The unique ID for the transaction.
 * @param {number} [options.value] - The value of the conversion (e.g., purchase price).
 * @param {string} [options.currency] - The currency of the value (e.g., 'USD').
 * @returns {boolean} Returns false to prevent default link behavior.
 */
export function gtag_report_conversion({
  url,
  transaction_id = "",
  value,
  currency = "USD",
} = {}) {
  const callback = () => {
    if (typeof url !== "undefined") {
      window.location = url
    }
  }

  if (window.gtag && window.gtag != null && window.gtag != undefined) {
    window.gtag("event", "conversion", {
      send_to: "AW-17630445738/ZmeBCIja-aobEKqB7dZB",
      transaction_id: transaction_id,
      value: value,
      currency: currency,
      event_callback: callback,
    })
   } else {
    console.error("Google Tag (gtag.js) is not loaded, cannot report conversion.")
  }

  return false
}
