import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { config } from "../config/environment"
import api from "../utils/api"

export const useAccountStore = defineStore("account", () => {
  // State
  const state = ref({
    default_payment_method: null,
    payment_methods: [],
    notifications: [],
    initial_onboard_steps: [],
    agency_progress_tracker_steps: [],
    unviewed_notifications: 0,
    loading: {
      payment_methods: false,
      payment_method: false,
      creating_payment_method: false, //used in direct js calls to stripe
      notifications: false,
    },
  })

  //Computed
  const notificationUrl = computed(() => config.notificationApiUrl)
  const billingApiUrl = computed(() => config.billingApiUrl)
  const appApiUrl = computed(() => config.appApiUrl)

  //Mutations
  function setLoading(type, value) {
    state.value.loading[type] = value
  }

  function addPaymentMethod(data) {
    state.value.payment_methods.push(data)
  }

  function setDefaultPaymentMethod(default_payment_method) {
    state.value.default_payment_method = default_payment_method
  }

  function setNotifications(notifications) {
    // Filter and assign notifications based on type
    state.value.notifications = []
    state.value.initial_onboard_steps = []
    state.value.agency_progress_tracker_steps = []

    notifications.forEach((notification) => {
      if (notification.type === "initial_onboard_step") {
        state.value.initial_onboard_steps.push(notification)
      } else if (notification.type === "agency_progress_tracker_step") {
        state.value.agency_progress_tracker_steps.push(notification)
      } else {
        state.value.notifications.push(notification)
      }
    })
  }

  function setUnviewedNotifications() {
    // Count unviewed notifications with safety checks
    const unviewedCount = state.value.notifications.filter(
      (notification) =>
        notification &&
        (notification.viewed === false ||
          notification.viewed === 0 ||
          notification.viewed === null)
    ).length

    state.value.unviewed_notifications = unviewedCount
  }

  // Actions
  async function getPaymentMethods(payload) {
    setLoading("payment_methods", true)
    await api
      .get(`${billingApiUrl.value}get_payment_methods/${payload.account_id}`)
      .then((res) => {
        state.value.payment_methods = res.data.payment_methods
        setDefaultPaymentMethod(res.data.default_payment_method)
        setLoading("payment_methods", false)
      })
      .catch((err) => {
        setLoading("payment_methods", false)
      })
  }

  function updateDefaultPaymentMethod(payload) {
    return new Promise((resolve, reject) => {
      setLoading("payment_method", true)

      api
        .post(`${billingApiUrl.value}update_default_payment_method`, {
          account_id: payload.account_id,
          payment_method: payload.payment_method,
          new_method: payload.new_method,
        })
        .then((response) => {
          if (payload.new_method) {
            addPaymentMethod(response.data.payment_method)
          }

          setDefaultPaymentMethod(response.data.payment_method)
          setLoading("payment_method", false)
          resolve(response)
        })
        .catch((error) => {
          setLoading("payment_method", false)
          reject(error)
        })
    })
  }

  function getNotifications(payload) {
    return new Promise((resolve, reject) => {
      setLoading("notifications", true)
      api
        .post(`${notificationUrl.value}get_notifications`, {
          account_id: payload.account_id,
        })
        .then((response) => {
          setNotifications(response.data.notifications)
          setUnviewedNotifications()
          setLoading("notifications", false)
          resolve(response)
        })
        .catch((error) => {
          setLoading("notifications", false)
          reject(error)
        })
    })
  }

  function markNotificationAsViewed(payload) {
    return new Promise((resolve, reject) => {
      api
        .post(`${notificationUrl.value}notification_viewed`, {
          notification_id: payload.notification_id,
        })
        .then((response) => {
          setLoading("notifications", false)
          resolve(response)
        })
        .catch((error) => {
          setLoading("notifications", false)
          reject(error)
        })
    })
  }

  function createAgencyNotifications(payload) {
    return new Promise((resolve, reject) => {
       if (state.value.agency_progress_tracker_steps.length > 0) {
        resolve()
        return
      }
      api
        .get(`${appApiUrl.value}notifications/create_agency_notifications/${payload.account_id}`)
        .then((response) => {
          resolve(response)

          getNotifications({ account_id: payload.account_id })
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    state,
    //actions
    getPaymentMethods,
    updateDefaultPaymentMethod,
    getNotifications,
    markNotificationAsViewed,
    createAgencyNotifications,
  }
})
