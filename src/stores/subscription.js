import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { config } from "../config/environment"
import { useAuthStore } from "./auth"
import { useLicenseStore } from "./license"
import api from "../utils/api"

export const useSubscriptionStore = defineStore("subscription", () => {
  // State
  const state = ref({
    subscriptions: null,
    invoices: [],
    upcoming_invoices: [],
    subscription_proration_preview: null,
    loading: {
      subscriptions: false,
      subscription_domain: false,
      subscription_translations: false,
      invoices: false,
      subscription_payment_method: false,
      retry_failed_invoice: false,
      subscription_proration_preview: false,
    },
  })

  //Computed
  const authStore = useAuthStore()
  const appApiUrl = computed(() => config.appApiUrl)
  const billingApiUrl = computed(() => config.billingApiUrl)

  //Mutations
  function setLoading(type, value) {
    state.value.loading[type] = value
  }

  function setSubscriptions(subscriptions) {
    state.value.subscriptions = subscriptions
  }

  function setSubscriptionLicense(license) {
    if (!state.value.subscriptions) return
    const subIndex = state.value.subscriptions.findIndex(
      (sub) => sub.id === license.subscription_id
    )
    if (subIndex > -1) {
      state.value.subscriptions[subIndex] = {
        ...state.value.subscriptions[subIndex],
        license: license,
      }
    }
    setLoading("subscription_domain", false)
  }

  // function setSubscriptionTranslations(translations) {
  //   if (!state.value.subscriptions) return
  //   const subIndex = state.value.subscriptions.findIndex(
  //     (sub) => sub.id === translations.subscription_id
  //   )
  //   if (subIndex > -1) {
  //     state.value.subscriptions[subIndex] = {
  //       ...state.value.subscriptions[subIndex],
  //       subscription_translations: translations,
  //     }
  //     setLoading("subscription_translations", false)
  //   }
  // }

  function removeSubscription(subscription) {
    state.value.subscriptions = state.value.subscriptions.filter(
      (sub) => sub.id !== subscription.id
    )
  }

  function setInvoices(invoices) {
    if (!invoices || invoices.length === 0) return

    const subscriptionId = invoices[0].subscription_id

    // Filter out old invoices for the specific subscription
    const otherInvoices = state.value.invoices.filter(
      (invoice) => invoice.subscription_id !== subscriptionId
    )

    const nonDraftInvoices = invoices.filter(
      (invoice) => invoice.status !== "draft"
    )
    state.value.invoices = [...otherInvoices, ...nonDraftInvoices]
  }

  function setUpcomingInvoices(upcoming_invoice) {
    // Filter out the old upcoming invoice for the specific subscription
    const otherUpcomingInvoices = state.value.upcoming_invoices.filter(
      (inv) => inv.subscription_id !== upcoming_invoice.subscription_id
    )
    state.value.upcoming_invoices = [...otherUpcomingInvoices, upcoming_invoice]
  }

  function setProrationAmount(amount) {
    state.value.subscription_proration_preview = amount
  }

  // Actions
  function getSubscriptions(payload) {
    return new Promise((resolve, reject) => {
      const licenseStore = useLicenseStore()
      setLoading("subscriptions", true)
      api
        .post(`${billingApiUrl.value}get_subscriptions`, {
          account_id: payload.account_id,
        })
        .then((res) => {
          let subscriptionsToSet = []
          if (
            res.data &&
            res.data.subscriptions &&
            res.data.subscriptions.length > 0
          ) {
            subscriptionsToSet = res.data.subscriptions

            // If embedded, only show the subscription for the active license
            const isEmbedded = window.WebLinguistDashboard?.isEmbedded
            if (isEmbedded) {
              const activeLicense = licenseStore.state.active_license
              if (activeLicense && activeLicense.subscription_id) {
                subscriptionsToSet = subscriptionsToSet.filter(
                  (sub) => sub.id === activeLicense.subscription_id
                )
              } else {
                // In embedded mode, if no active license has a subscription, show none.
                subscriptionsToSet = []
              }
            }

            setSubscriptions(subscriptionsToSet)
            subscriptionsToSet.forEach((subscription) => {
              getSubscriptionDetails({
                subscription_id: subscription.id,
              })
              getSubscriptionInvoices({
                subscription_id: subscription.stripe_id,
              })
            })
          } else {
            setSubscriptions(null)
          }
          setLoading("subscriptions", false)
          resolve(res)
        })
        .catch((err) => {
          console.error(err)
          setLoading("subscriptions", false)
          reject(err)
        })
    })
  }

  function getSubscriptionInvoices(payload) {
    return new Promise((resolve, reject) => {
      setLoading("invoices", true)
      api
        .post(`${billingApiUrl.value}get_subscription_invoices`, {
          subscription_id: payload.subscription_id,
        })
        .then((res) => {
          if (res.data && res.data.invoices) {
            setInvoices(res.data.invoices)
            if (res.data.upcoming_invoice) {
              setUpcomingInvoices(res.data.upcoming_invoice)
            }
          }
          setLoading("invoices", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("invoices", false)
          reject(err)
        })
    })
  }

  function cancelSubscription(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscriptions", true)
      api
        .post(`${billingApiUrl.value}cancel_subscription`, {
          subscription_id: payload.subscription_id,
          immediately: payload.immediately,
        })
        .then((res) => {
          //only remove subscription from state if its been set to cancel immediately
          if (
            res.data &&
            res.data.subscription &&
            res.data.subscription.ends_at === null
          ) {
            removeSubscription(res.data.subscription)
          }
          setLoading("subscriptions", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscriptions", false)
          reject(err)
        })
    })
  }

  function saveSubscriptionDetails(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscription_domain", true)
      setLoading("subscription_translations", true)
      api
        .post(`${appApiUrl.value}subscription/save_subscription_details`, {
          account_id: payload.account_id,
          subscription_id: payload.subscription_id,
          domain: payload.domain,
          translations: payload.translations,
        })
        .then((res) => {
          setLoading("subscription_domain", false)
          setLoading("subscription_translations", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscription_domain", false)
          setLoading("subscription_translations", false)
          reject(err)
        })
    })
  }

  function getSubscriptionDetails(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscription_domain", true)
      setLoading("subscription_translations", true)
      api
        .post(`${appApiUrl.value}subscription/get_subscription_details`, {
          subscription_id: payload.subscription_id,
        })
        .then((res) => {
          if (res && res.data.license && res.data.subscription_translations) {
            setSubscriptionLicense(res.data.license)
            // setSubscriptionTranslations(res.data.subscription_translations)
          } else {
            setLoading("subscription_domain", false)
            setLoading("subscription_translations", false)
          }
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscription_domain", false)
          setLoading("subscription_translations", false)
          reject(err)
        })
    })
  }

  function updateSubscriptionPaymentMethod(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscription_payment_method", true)
      api
        .post(`${billingApiUrl.value}update_subscription_payment_method`, {
          subscription_id: payload.subscription_id,
          payment_method_id: payload.payment_method_id,
          payment_method_stripe_id: payload.payment_method_stripe_id,
        })
        .then((res) => {
          if (res && res.data.subscription_payment_method) {
            setSubscriptionPaymentMethod(res.data.subscription_payment_method)
          }
          setLoading("subscription_payment_method", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscription_payment_method", false)
          reject(err)
        })
    })
  }

  function updateSubscriptionLicense(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscription_domain", true)
      api
        .post(`${appApiUrl.value}subscription/update_subscription_domain`, {
          subscription_id: payload.subscription_id,
          domain: payload.domain,
        })
        .then((res) => {
          if (res && res.data.license) {
            setSubscriptionLicense(res.data.license)
          }
          setLoading("subscription_domain", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscription_domain", false)
          reject(err)
        })
    })
  }

  // function updateSubscriptionTranslations(payload) {
  //   return new Promise((resolve, reject) => {
  //     setLoading("subscription_translations", true)
  //     api
  //       .post(
  //         `${appApiUrl.value}subscription/update_subscription_translations`,
  //         {
  //           subscription_id: payload.subscription_id,
  //           translations: payload.translations,
  //         }
  //       )
  //       .then((res) => {
  //         if (res && res.data.subscription_translations) {
  //           setSubscriptionTranslations(res.data.subscription_translations)
  //         }
  //         setLoading("subscription_translations", false)
  //         resolve(res)
  //       })
  //       .catch((err) => {
  //         setLoading("subscription_translations", false)
  //         reject(err)
  //       })
  //   })
  // }

  function retryFailedInvoice(payload) {
    return new Promise((resolve, reject) => {
      setLoading("retry_failed_invoice", true)
      api
        .post(`${billingApiUrl.value}retry_failed_invoice`, {
          invoice_id: payload.invoice_id,
          payment_method: payload.payment_method,
          account_id: payload.account_id,
        })
        .then((res) => {
          setLoading("retry_failed_invoice", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("retry_failed_invoice", false)
          reject(err)
        })
    })
  }

  function previewUpdateProration(payload) {
    setProrationAmount(null)
    return new Promise((resolve, reject) => {
      setLoading("subscription_proration_preview", true)
      api
        .post(`${billingApiUrl.value}preview_update_proration`, {
          subscription_id: payload.subscription_id,
          new_price: payload.new_price,
          account_id: payload.account_id,
        })
        .then((res) => {
          if (res && res.data && res.data.proration_amount) {
            setProrationAmount(res.data.proration_amount)
          } else {
            setProrationAmount(null)
          }
          setLoading("subscription_proration_preview", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscription_proration_preview", false)
          reject(err)
        })
    })
  }

  /**
   * Upgrade a free license to a paid subscription.
   * Called after Stripe subscription is created.
   */
  function upgradeFreeLicense(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscriptions", true)
      api
        .post(
          `${appApiUrl.value}subscription/upgrade_free_license`,
          {
            license_id: payload.license_id,
            subscription_id: payload.subscription_id,
            domain: payload.domain,
            translations: payload.translations,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          setLoading("subscriptions", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscriptions", false)
          reject(err)
        })
    })
  }

  /**
   * Schedule downgrade to free tier at end of billing period.
   * User keeps current service until period ends.
   */
  function downgradeToFree(payload, authStore) {
    return new Promise((resolve, reject) => {
      setLoading("subscriptions", true)
      api
        .post(
          `${appApiUrl.value}subscription/downgrade_to_free`,
          {
            license_id: payload.license_id,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          setLoading("subscriptions", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscriptions", false)
          reject(err)
        })
    })
  }

  /**
   * Cancel a scheduled change (undo pending cancellation/downgrade).
   * User decides to keep their subscription.
   */
  function cancelScheduledChange(payload, authStore) {
    return new Promise((resolve, reject) => {
      setLoading("subscriptions", true)
      api
        .post(
          `${appApiUrl.value}subscription/cancel_scheduled_change`,
          {
            license_id: payload.license_id,
          },
          {
            headers: {
              "X-Account-ID": authStore.currentAccountId.toString(),
            },
          }
        )
        .then((res) => {
          setLoading("subscriptions", false)
          resolve(res)
        })
        .catch((err) => {
          setLoading("subscriptions", false)
          reject(err)
        })
    })
  }

  return {
    state,
    getSubscriptions,
    getSubscriptionInvoices,
    cancelSubscription,
    saveSubscriptionDetails,
    getSubscriptionDetails,
    updateSubscriptionLicense,
    // updateSubscriptionTranslations,
    retryFailedInvoice,
    updateSubscriptionPaymentMethod,
    previewUpdateProration,
    upgradeFreeLicense,
    downgradeToFree,
    cancelScheduledChange,
  }
})
