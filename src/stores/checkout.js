import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { config } from "../config/environment"
import api from "../utils/api"
import { useAuthStore } from "./auth"

export const useCheckoutStore = defineStore("checkout", () => {
  // State
  const state = ref({
    checkout_products: [],
    //features array controls Sort Order of Checkout Products
    //Starter is the base name of the plan on stripe, Standard is now the visual name
    checkout_products_features: {
      Free: [
        "10,000 Words/Month",
        "1 Language",
        "Translation Only",
        "Multiple Interface Options",
      ],
      Starter: [
        "Unlimited Words & Pages",
        "Bilingual",
        "SEO Indexing",
        "Meta Data Translation",
        "Phrase Glossary",
        "Automatic Content Updates",
        "Multiple Interface Options",
      ],
      Growth: [
        "Unlimited Words & Pages",
        "3 languages",
        "Fully Qualified Urls",
        "Deep SEO Indexing",
        "Meta Data Translation",
        "Text-to-Speech",
        "Phrase Glossary",
        "Automatic Content Updates",
        "Multiple Interface Options",
      ],
      Pro: [
        "Unlimited Words & Pages",
        "5 languages",
        "Fully Qualified Urls",
        "Deep SEO Indexing",
        "Meta Data Translation",
        "Text-to-Speech",
        "Phrase Glossary",
        "Automatic Content Updates",
        "Multiple Interface Options",
      ],
    },
    // Virtual Free product (injected for free users)
    freeProduct: {
      id: "free-tier",
      name: "Free",
      description: "Get started with basic translation features",
      display_order: 0,
      prices: [
        {
          id: "free-tier-price",
          unit_amount: 0,
          currency: "usd",
          recurring: { interval: "month" },
        },
        {
          id: "free-tier-price",
          unit_amount: 0,
          currency: "usd",
          recurring: { interval: "year" },
        },
      ],
      is_free_tier: true,
    },
    addon_products: [],
    coupon_code: ref(null),
    coupon_validation_errors: ref([]),
    subscription_coupon_discount: ref(null),
    setup_intent_secret: ref(null),
    checkout_drawer_open: false,
    loading: {
      checkout_products: false,
      addon_products: false,
      subscription_coupon_discount: false,
      subscription_update: false,
      checkout: false,
      creating_payment_method: false,
      subscription_update: false,
      setup_intent_secret: false,
    },
  })

  //Computed
  const billingApiUrl = computed(() => config.billingApiUrl)

  //Mutations
  function setLoading(type, value) {
    state.value.loading[type] = value
  }

  function setProducts(type, item) {
    state.value[type].push(item)
  }

  function clearProducts() {
    state.value.checkout_products = []
    state.value.addon_products = []
  }

  function setSetupIntentSecret(secret) {
    state.value.setup_intent_secret = secret
  }

  function setCouponDiscount(discount) {
    state.value.subscription_coupon_discount = discount
  }

  function setCoupon(coupon) {
    console.log("ran set coupon", coupon)
    state.value.coupon = coupon
  }

  function setServerCouponValidationErrors(errors) {
    state.value.coupon_validation_errors = errors
  }

  function clearCoupon() {
    state.value.coupon = null
    state.value.subscription_coupon_discount = null
  }

  function setCheckoutDrawerOpen(isOpen) {
    state.value.checkout_drawer_open = isOpen
  }

  // Actions
  async function getCheckoutProducts(isFreeUser = false) {
    setLoading("checkout_products", true)
    await api
      .get(`${billingApiUrl.value}get_checkout_products`)
      .then((res) => {
        console.log(res)

        if (res && res.data && res.data.products) {
          clearProducts()

          const productRankOrder = Object.keys(
            state.value.checkout_products_features
          )
          let allProducts = [...res.data.products]

          // Inject Free product for free users (at the beginning)
          if (isFreeUser) {
            allProducts.unshift(state.value.freeProduct)
          }

          const sortedProducts = allProducts.sort((a, b) => {
            const rankA = productRankOrder.indexOf(a.name)
            const rankB = productRankOrder.indexOf(b.name)

            // if not in rank order, don't move it
            if (rankA === -1 || rankB === -1) return 0

            return rankA - rankB
          })

          sortedProducts.forEach((product) => {
            // Free product or products with display_order > 0 go to checkout_products
            if (product.is_free_tier || product.display_order > 0) {
              setProducts("checkout_products", product)
            } else {
              setProducts("addon_products", product)
            }
          })
        }

        setLoading("checkout_products", false)
      })
      .catch((err) => {
        setLoading("checkout_products", false)
      })
  }

  function createSetupIntent(payload) {
    setLoading("setup_intent_secret", true)
    api
      .post(`${billingApiUrl.value}create_setup_intent`, {
        account_id: payload.account_id,
      })
      .then((res) => {
        if (res.data && res.data.setupIntent) {
          setSetupIntentSecret(res.data.setupIntent.client_secret)
        } else {
          console.error("No setup intent secret found in response", res.data)
        }
        setLoading("setup_intent_secret", false)
      })
      .catch((err) => {
        setLoading("setup_intent_secret", false)
      })
  }

  function validateCouponCode(payload) {
    setServerCouponValidationErrors([])
    setLoading("subscription_coupon_discount", true)

    api
      .post(`${billingApiUrl.value}validate_coupon`, {
        coupon_code: payload.coupon_code,
        price_id: payload.price_id,
      })
      .then((res) => {
        // Commit the mutation with the response data
        if (res.data.success == 1) {
          setCouponDiscount(res.data.discount_amount)
          setCoupon(res.data.coupon_data)
          setLoading("subscription_coupon_discount", false)
        } else {
          setServerCouponValidationErrors([res.data.message])
          setLoading("subscription_coupon_discount", false)
        }
      })
      .catch((err) => {
        console.log("err", err)
        setServerCouponValidationErrors([])
        setCoupon(null)
        setCouponDiscount(null)

        if (err.response) {
          switch (err.response.status) {
            case 400:
              setServerCouponValidationErrors(["Coupon code is invalid"])
              break
            case 401:
              setServerCouponValidationErrors(["Unauthorized"])
              break
            case 404:
              setServerCouponValidationErrors(["Coupon code not found"])
              break
            case 422:
              if (err.response.data.errors) {
                Object.values(err.response.data.errors).forEach(
                  (errorArray) => {
                    errorArray.forEach((error) => {
                      setServerCouponValidationErrors([error])
                    })
                  }
                )
              }
              break
            case 500:
              console.log("Server error", err.response)
              setServerCouponValidationErrors([
                "Server error. Please try again later.",
              ])
              break
            default:
              console.log("Unknown error:", err.response)
              setServerCouponValidationErrors(["An unexpected error occurred"])
          }
        } else if (err.request) {
          // Network error
          console.log("Network error")
          setServerCouponValidationErrors([
            "Network error. Please check your connection.",
          ])
        } else {
          // Other error
          console.log("Error:", err.message)
          setServerCouponValidationErrors([
            "An error occurred. Please try again.",
          ])
        }
        clearCoupon()
        console.log(err)
        setLoading("subscription_coupon_discount", false)
      })
  }

  function handleCheckout(payload) {
    return new Promise((resolve, reject) => {
      setLoading("checkout", true)
      api
        .post(`${billingApiUrl.value}subscription_purchase`, {
          name: payload.name,
          plan: payload.plan,
          price: payload.price,
          payment_method: payload.payment_method,
          new_method: payload.new_method,
          new_method_name: payload.new_method_name,
          account_id: payload.account_id,
          create_with_default: payload.create_with_default,
          coupon_code: payload.coupon_code,
          free_trial: payload.free_trial,
          addon_prices: payload.addon_prices,
        })
        .then((response) => {
          if (response.data.success) {
            const authStore = useAuthStore()
            authStore.initialOnboardComplete = 1
          }
          setLoading("checkout", false)
          resolve(response)
        })
        .catch((error) => {
          setLoading("checkout", false)
          reject(error)
        })
    })
  }

  function handleUpdateSubscription(payload) {
    return new Promise((resolve, reject) => {
      setLoading("subscription_update", true)
      api
        .post(`${billingApiUrl.value}update_subscription`, {
          subscription_id: payload.subscription_id,
          new_price: payload.new_price,
          account_id: payload.account_id,
          name: payload.name,
          coupon_code: payload.coupon_code,
          prorate: payload.prorate,
          payment_method_stripe_id: payload.payment_method_stripe_id,
          addon_prices: payload.addon_prices,
        })
        .then((response) => {
          if (response.data.success) {
            const authStore = useAuthStore()
            authStore.initialOnboardComplete = 1
          }
          setLoading("subscription_update", false)
          resolve(response)
        })
        .catch((error) => {
          setLoading("subscription_update", false)
          reject(error)
        })
    })
  }

  /**
   * Create a free tier license (no payment required)
   */
  function handleCreateFreeLicense(payload) {
    return new Promise((resolve, reject) => {
      setLoading("checkout", true)
      api
        .post(
          `${config.appApiUrl}licenses/free`,
          {
            domain_name: payload.domain,
            language: payload.language,
          },
          {
            headers: {
              "X-Account-ID": payload.account_id,
            },
          }
        )
        .then((response) => {
          setLoading("checkout", false)
          resolve(response)
        })
        .catch((error) => {
          setLoading("checkout", false)
          reject(error)
        })
    })
  }

  return {
    state,
    getCheckoutProducts,
    createSetupIntent,
    validateCouponCode,
    setLoading,
    handleCheckout,
    handleUpdateSubscription,
    handleCreateFreeLicense,
    setCouponDiscount,
    setCoupon,
    setCheckoutDrawerOpen,
  }
})
