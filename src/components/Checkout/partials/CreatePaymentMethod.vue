<template>
  <div :class="[from === 'settings' ? 'position-relative' : '']">
    <SlideInNotification
      :show="showSuccessNotification"
      message="Payment method created successfully"
      type="success"
    />
    <SlideInNotification
      :show="showFailNotification"
      message="Failed to create payment method"
      type="error"
    />
    <SlideInNotification
      :show="showGenericFailNotification"
      message="An error occurred"
      type="error"
    />
    <div>
      <div>
        <label for="name_on_card">Name on Card</label>
        <ll-input
          v-model="name_on_card"
          name="name_on_card"
          id="name_on_card"
        ></ll-input>

        <span
          class="validation-error"
          v-if="validation_errors.name_on_card.length > 0"
        >
          <p v-for="error in validation_errors.name_on_card" :key="error">
            {{ error }}
          </p>
        </span>
      </div>

      <br />
      <StripeElements
        v-if="finalElementsOptions && finalElementsOptions.clientSecret"
        ref="elementsRef"
        :stripe-key="publishable_key"
        :elements-options="finalElementsOptions"
      >
        <label for="card_details">Card Details</label>
        <StripeElement
          ref="cardRef"
          type="card"
          class="stripe-card"
          :options="cardOptions"
          id="card_details"
          @ready="isCardReady = true"
        />
      </StripeElements>

      <br />

      <br />

      <button
        v-if="from === 'settings'"
        @click.prevent="handleCreate"
        class="btn btn-primary"
      >
        <span v-if="loading"> Loading... </span>
        <span v-else> Submit </span>
      </button>

      <button
        v-if="from === 'finalize_checkout' && product && price"
        :class="[
          'btn',
          'btn-primary',
          'btn-highlight',
          { 'show-btn-absolute-helper': from === 'finalize_checkout' },
        ]"
        @click.prevent="
          !is_switching ? handleCreateThenCheckout() : handleCreateThenUpdate()
        "
        :disabled="!isCardReady"
      >
        <span v-if="plan_comparison === null"> Complete Purchase </span>
        <span v-else> Confirm Changes </span>
      </button>
    </div>

    <div class="loading-overlay" v-if="loading && from === 'settings'">
      <div class="loading-container">
        <div class="loading-spinner"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue"
import { useAuthStore } from "../../../stores/auth"
import { useCheckoutStore } from "../../../stores/checkout"
import { useSubscriptionStore } from "../../../stores/subscription"
import { useAccountStore } from "../../../stores/account"
import { useLicenseStore } from "../../../stores/license"
import { StripeElements, StripeElement } from "vue-stripe-js"
import LlButton from "../../Root/Button/LlButton.vue"
import LlInput from "../../Root/Input/LlInput.vue"
import SlideInNotification from "../../SlideInNotification.vue"
import Swal from "sweetalert2"
import { useRoute, useRouter } from "vue-router"
import { gtag_report_conversion } from "../../../utils/analytics.js"

export default {
  name: "CreatePaymentMethod",
  components: {
    StripeElements,
    StripeElement,
    LlButton,
    LlInput,
    SlideInNotification,
  },
  props: {
    from: {
      type: String,
      default: "settings",
    },
    product: {
      type: Object,
      default: null,
    },
    price: {
      type: Object,
      default: null,
    },
    addons: {
      type: Array,
      default: null,
    },
    domain: {
      type: String,
      default: null,
    },
    selected_languages: {
      type: Array,
      default: [],
    },
    coupon_code: {
      type: String,
      default: null,
    },
    initial_onboard_setup: {
      type: Boolean,
      default: false,
    },
    is_switching: {
      type: Boolean,
      default: false,
    },
    current_subscription_id: {
      type: Number,
      default: null,
    },
    prorate: {
      type: Boolean,
      default: false,
    },
    setup_your_plan_initial_onboard_step: {
      type: Object,
      default: null,
    },
    is_free_update: {
      type: Boolean,
      default: false,
    },
    plan_comparison: {
      type: Object,
      default: null,
    },
    defineEmits: ["paymentMethodCreated"],
  },
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const checkoutStore = useCheckoutStore()
    const subscriptionStore = useSubscriptionStore()
    const accountStore = useAccountStore()
    const licenseStore = useLicenseStore()

    const showSuccessNotification = ref(false)
    const showFailNotification = ref(false)
    const showGenericFailNotification = ref(false)

    const route = useRoute()
    const router = useRouter()

    const validation_errors = ref({
      name_on_card: [],
    })
    const name_on_card = ref("")
    const save_as_default = ref(true)
    const elementsRef = ref(null)
    const elementsOptions = ref({
      currency: "usd",
    })
    const cardOptions = ref({
      style: {
        base: {
          fontFamily: "Arial",
          fontSize: "16px",
        },
        ":focus": {
          borderColor: "#66b1ff",
        },
      },
    })
    const cardRef = ref(null)
    const isCardReady = ref(false)
    const publishable_key = ref(
      import.meta.env.VITE_STRIPE_GATEWAY_MODE === "LIVE"
        ? import.meta.env.VITE_STRIPE_KEY_LIVE
        : import.meta.env.VITE_STRIPE_KEY_TEST
    )
    const addonPrices = ref([])

    //computed
    const loading = computed(() => {
      return (
        checkoutStore.state.loading.subscription_update ||
        checkoutStore.state.loading.payment_method ||
        checkoutStore.state.loading.checkout ||
        checkoutStore.state.loading.creating_payment_method ||
        checkoutStore.state.loading.subscription_proration_preview
      )
    })
    const setupIntentSecret = computed(
      () => checkoutStore.state.setup_intent_secret
    )

    const finalElementsOptions = computed(() => ({
      ...elementsOptions.value,
      // The clientSecret is required for Stripe Elements to initialize properly.
      clientSecret: setupIntentSecret.value,
    }))

    //methods
    function getScrubbedLanguages() {
      // We use map to create a new array. For each language object,
      // we use object destructuring with rest parameters to create a new object
      // that includes all properties except for 'flag'.
      return props.selected_languages.map(({ flag, ...rest }) => rest)
    }

    function selectCorrectAddonPrice(addonProduct) {
      console.log("selected overall price: ", props.price)

      let realAddonPrice

      if (
        props.price &&
        addonProduct &&
        addonProduct.prices &&
        addonProduct.prices.length > 0
      ) {
        //check if addon product has multiple prices
        realAddonPrice = addonProduct.prices.find(
          (price) =>
            price.recurring &&
            price.recurring.interval === props.price.recurring.interval
        )
      }
      return realAddonPrice ? realAddonPrice : addonProduct.prices[0]
    }

    function buildAddonPricesArray() {
      let addonPrices = []

      if (props.addons && props.addons.length > 0) {
        //select out correct pricing if applicable
        props.addons.forEach((addonProduct) => {
          addonPrices.push(selectCorrectAddonPrice(addonProduct).id)
        })
      }

      addonPrices.value = addonPrices
    }

    async function handleCreate() {
      validation_errors.value = {
        name_on_card: [],
      }

      checkoutStore.setLoading("creating_payment_method", true)

      if (name_on_card.value === "") {
        validation_errors.value.name_on_card.push("Name on card is required")
        checkoutStore.setLoading("creating_payment_method", false)
        return
      }

      if (!elementsRef.value || !cardRef.value?.stripeElement) {
        console.error(
          "Stripe elements not ready yet.",
          finalElementsOptions.value
        )
        Swal.fire({
          title: "Error",
          text: "Payment form is not ready. Please wait a moment and try again.",
          icon: "error",
          confirmButtonText: "Ok",
        })
        checkoutStore.setLoading("creating_payment_method", false)
        return
      }

      const stripe = elementsRef.value.instance
      const cardElement = cardRef.value.stripeElement

      if (setupIntentSecret.value) {
        const { error, setupIntent } = await stripe.confirmCardSetup(
          setupIntentSecret.value,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: name_on_card.value,
              },
            },
          }
        )

        if (error) {
          console.error(error)
          showFailNotification.value = true
          setTimeout(() => {
            showFailNotification.value = false
          }, 3000)
          checkoutStore.setLoading("creating_payment_method", false)
          return null
        } else if (setupIntent && setupIntent.status === "succeeded") {
          // Now that the card is set up, save it as the default in your backend
          return accountStore
            .updateDefaultPaymentMethod({
              account_id: authStore.currentAccountId,
              payment_method: setupIntent.payment_method,
              new_method: true,
            })
            .then(() => {
              checkoutStore.setLoading("creating_payment_method", false)

              if (props.from === "settings") {
                showSuccessNotification.value = true
                setTimeout(() => {
                  emit("paymentMethodCreated")
                  showSuccessNotification.value = false
                }, 2000)
              }

              return setupIntent.payment_method
            })
            .catch((err) => {
              if (props.from === "settings") {
                showGenericFailNotification.value = true
                setTimeout(() => {
                  showGenericFailNotification.value = false
                }, 3000)
              }

              checkoutStore.setLoading("creating_payment_method", false)
              return null
            })
        }
      }
      checkoutStore.setLoading("creating_payment_method", false)
      return null
    }

    async function handleCreateThenCheckout() {
      const newPaymentMethodId = await handleCreate()

      if (newPaymentMethodId) {
        // The payment method was created and set as default successfully.
        // Now, proceed with the checkout logic using the newly created (and now default) payment method.
        buildAddonPricesArray()

        checkoutStore
          .handleCheckout({
            name: props.product.name,
            plan: props.product.id,
            price: props.price.id,
            payment_method:
              accountStore.state.default_payment_method.stripe_method_id,
            new_method: false,
            account_id: authStore.currentAccountId,
            create_with_default: false,
            coupon_code: props.coupon_code,
            free_trial: false,
            addon_prices: addonPrices.value,
          })
          .then((res) => {
            if (res && (res.data.success || parseInt(res.data.success) === 1)) {
              if (props.is_free_update) {
                // Upgrade existing free license to paid subscription
                subscriptionStore
                  .upgradeFreeLicense({
                    license_id: route.params.id,
                    subscription_id: res.data.subscription.id,
                    domain: props.domain,
                    translations: getScrubbedLanguages(),
                  })
                  .then((upgradeResponse) => {
                    if (
                      window.WebLinguistDashboard?.isEmbedded &&
                      upgradeResponse.data.license
                    ) {
                      licenseStore.saveLicenseToWordPress({
                        license_id: upgradeResponse.data.license.id,
                        license_key: upgradeResponse.data.license.license_key,
                        subscription_id:
                          upgradeResponse.data.license.subscription_id,
                      })
                    }
                    subscriptionStore.getSubscriptions({
                      account_id: authStore.currentAccountId,
                    })
                    // Refresh licenses to update the free license status
                    licenseStore.getLicenses()
                  })
              } else {
                subscriptionStore
                  .saveSubscriptionDetails({
                    account_id: authStore.currentAccountId,
                    subscription_id: res.data.subscription.id,
                    domain: props.domain,
                    translations: getScrubbedLanguages(),
                  })
                  .then((newLicenseResponse) => {
                    if (
                      window.WebLinguistDashboard?.isEmbedded &&
                      newLicenseResponse.data.license
                    ) {
                      licenseStore.saveLicenseToWordPress({
                        license_id: newLicenseResponse.data.license.id,
                        license_key:
                          newLicenseResponse.data.license.license_key,
                        subscription_id:
                          newLicenseResponse.data.license.subscription_id,
                      })
                    }
                    subscriptionStore.getSubscriptions({
                      account_id: authStore.currentAccountId,
                    })
                  })
              }

              gtag_report_conversion({
                transaction_id: res.data.subscription.stripe_id,
                value: parseFloat(props.price.unit_amount), // Or calculate real cost if possible
                currency: "USD",
              })

              //mark 'setup your plan' notification as viewed if onboarding
              if (
                !props.initial_onboard_setup ||
                (props.initial_onboard_setup === 0 &&
                  props.setup_your_plan_initial_onboard_step)
              ) {
                accountStore
                  .markNotificationAsViewed({
                    notification_id:
                      props.setup_your_plan_initial_onboard_step.id,
                  })
                  .then(() => {
                    accountStore.getNotifications({
                      account_id: authStore.currentAccountId,
                    })
                    router.push({
                      path: "/success-confirmation/initial-purchase",
                    })
                  })
              } else {
                router.push({ path: "/success-confirmation/purchase" })
              }
            } else if (
              res &&
              parseInt(res.data.success) === 0 &&
              res.data.message &&
              res.data.error
            ) {
              //error with message
              Swal.fire({
                title: res.message,
                text: res.error,
                icon: "error",
                confirmButtonText: "Ok",
              })
            } else {
              //generic error
              Swal.fire({
                title: "Error",
                text: "Something went wrong. Please try again",
                icon: "error",
                confirmButtonText: "Ok",
              })
            }
          })
          .catch((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status == 402
            ) {
              Swal.fire({
                title: "Payment failed.",
                text: `Error Code: ${err.response.data.decline_code}`,
                icon: "error",
                confirmButtonText: "Ok",
              })
            } else {
              Swal.fire({
                title: "Error",
                text: "Something went wrong. Please try again",
                icon: "error",
                confirmButtonText: "Ok",
              })
            }
          })
      } else {
        console.log("Checkout halted because payment method creation failed.")
      }
    }

    async function handleCreateThenUpdate() {
      const newPaymentMethodId = await handleCreate()
      if (newPaymentMethodId) {
        buildAddonPricesArray()

        checkoutStore
          .handleUpdateSubscription({
            new_price: props.price.id,
            account_id: authStore.currentAccountId,
            subscription_id: props.current_subscription_id,
            prorate: props.prorate,
            name: props.product.name,
            coupon: props.coupon_code,
            payment_method_stripe_id:
              accountStore.state.default_payment_method.stripe_method_id,
            addon_prices: addonPrices.value,
          })
          .then((res) => {
            if (res && (res.data.success || parseInt(res.data.success) === 1)) {
              subscriptionStore
                .saveSubscriptionDetails({
                  account_id: authStore.currentAccountId,
                  subscription_id: props.current_subscription_id,
                  domain: props.domain,
                  translations: getScrubbedLanguages(),
                })
                .then(() => {
                  subscriptionStore.getSubscriptions({
                    account_id: authStore.currentAccountId,
                  })

                  props.plan_comparison?.type === "upgrade"
                    ? router.push({ path: "/success-confirmation/upgrade" })
                    : router.push({ path: "/success-confirmation/downgrade" })
                })
            } else if (
              res &&
              parseInt(res.data.success) === 0 &&
              res.message &&
              res.error
            ) {
              //error with message
              Swal.fire({
                title: res.message,
                text: res.error,
                icon: "error",
                confirmButtonText: "Ok",
              })
            } else {
              //generic error
              Swal.fire({
                title: "Error",
                text: "Something went wrong. Please try again",
                icon: "error",
                confirmButtonText: "Ok",
              })
            }
          })
          .catch((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status == 402
            ) {
              Swal.fire({
                title: "Payment failed.",
                text: `Error Code: ${err.response.data.decline_code}`,
                icon: "error",
                confirmButtonText: "Ok",
              })
            } else {
              Swal.fire({
                title: "Error",
                text: "Something went wrong. Please try again",
                icon: "error",
                confirmButtonText: "Ok",
              })
            }
          })
      } else {
        console.log(
          "Subscription update halted because payment method creation failed."
        )
      }
    }

    //mounted functions
    onMounted(() => {
      checkoutStore.createSetupIntent({
        account_id: authStore.currentAccountId,
      })
    })

    return {
      validation_errors,
      name_on_card,
      save_as_default,
      publishable_key,
      addonPrices,
      setupIntentSecret,
      cardOptions,
      finalElementsOptions,
      loading,
      showSuccessNotification,
      showFailNotification,
      showGenericFailNotification,
      //refs
      elementsRef,
      cardRef,
      isCardReady,
      //components
      LlInput,
      LlButton,
      SlideInNotification,
      //methods
      handleCreate,
      handleCreateThenCheckout,
      handleCreateThenUpdate,
    }
  },
}
</script>
<style scoped>
.show-btn-absolute-helper {
  position: absolute;
  bottom: 25px;
  right: 25px;
  padding: 15px 25px !important;
  font-size: 18px;
  font-weight: 400;
  border-radius: 35px !important;
}
.ll-button {
  background-color: white;
  color: black;
}
.ll-button:hover {
  color: #409eff;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}
.stripe-card {
  border: 1px solid black;
  border-radius: 4px;
  padding: 9.5px 15px;
  transition: ease-in-out, border-color 0.15s ease-in-out;
}
.stripe-card:hover {
  border-color: #aaaea6;
}
@media screen and (min-width: 1801px) {
  .show-btn-absolute-helper {
    right: 75px;
  }
}
@media screen and (max-width: 1650px) {
  .show-btn-absolute-helper {
    right: 25px;
  }
}
@media screen and (max-width: 1250px) {
}
@media screen and (max-width: 550px) {
  .show-btn-absolute-helper {
    position: relative;
    right: 0;
    bottom: 0;
  }
}
</style>
