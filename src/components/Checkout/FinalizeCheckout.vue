<template>
  <div :class="['finalize-checkout', { 'has-content': checkoutProduct, 'is-embedded': isEmbedded }]">
    <div>
      <div class="finalize-checkout-top" @click.stop="handleHeaderClick">
        <div v-if="checkoutProduct">
          <p>
            <span v-if="!show" class="expand-drawer-cta">
              Click Here to Checkout
            </span>
            <span v-else>
              Checkout
            </span>
          </p>
        </div>
        <span>
          <button
            type="button"
            class="close-button"
            :aria-label="show ? 'Collapse' : 'Expand'"
            @click.stop="closeDialog"
          >
            <ChevronUp v-if="show" size="30" fill-color="gray" />
            <ChevronDown v-else size="30" fill-color="gray" />
          </button>
        </span>
      </div>
      <div
        id="transition-container"
        :class="{ 'has-content': checkoutProduct && show }"
      >
        <div v-if="checkoutProduct && show" class="finalize-checkout-bottom">
          <!-- left side of drawer -->
          <div class="segment selection-details">
            <!-- <SelectionPreview
              v-if="current_subscription_product"
              :current_product="current_subscription_product"
              :selected_product="product"
              :upgrading="false"
            /> -->

            <ProductPreview
              v-if="initial_onboard_setup"
              :title="product.name === 'Starter' ? 'Standard' : product.name"
              body="Go global in minutes. Instantly translate your website into over 20 languages, complete with our advanced text-to-speech engine. Unlock new markets, dominate international SEO, and connect with a worldwide audience—no coding required."
            />
            <ProductPreview
              v-else
              title="Grow Your Business with AI-Powered Translation"
              :body="
                price.recurring.interval === 'year'
                  ? 'Web Linguist makes it easy to translate your website into multiple languages, helping businesses boost engagement, improve SEO, and increase conversions worldwide. Get started now!'
                  : 'Web Linguist makes it easy to translate your website into multiple languages, helping businesses boost engagement, improve SEO, and increase conversions worldwide. Get started now for as low as $1 for your first month!'
              "
            />

            <div class="checkout-selection-details">
              <p class="selected-domain">
                <span class="domain-label">Domain:</span>
                <span class="domain-value">
                  <a :href="domain" class="domain-link" target="_blank">{{
                    domain
                  }}</a>
                </span>
              </p>
              <ul class="selected-languages">
                <li v-for="language in selected_languages" :key="language.id">
                  <span class="code">{{ language.code }}</span>
                  <span
                    class="flag-icon"
                    v-if="language.flag"
                    v-html="language.flag"
                  ></span>
                </li>
              </ul>
            </div>

            <div
              class="addon-selection-details"
              v-if="
                selected_addon_products && selected_addon_products.length > 0
              "
            >
              <p class="addon-selection-details-title">Optional Add-Ons:</p>
              <span
                v-for="addonProduct in addon_products"
                :key="addonProduct.id"
                :class="[
                  {
                    'addon-selected':
                      selected_addon_products.findIndex(
                        (p) => p.id === addonProduct.id
                      ) >= 0,
                  },
                ]"
              >
                <span class="addon-info">
                  <a href="#">
                    <i class="fas fa-info-circle"></i>
                  </a>
                </span>
                <button
                  class="btn btn-outline"
                  @click="handleAddonProductClick(addonProduct)"
                  type="selected"
                >
                  {{ addonProduct.name }}
                  <span class="selected-indicator">
                    <i class="fas fa-check"></i>
                  </span>
                </button>
              </span>
            </div>
          </div>

          <!-- right side of drawer -->
          <div class="segment payment-details">
            <!-- Free tier - no payment section needed -->
            <div
              v-if="isFreeTier"
              class="free-tier-info"
              style="padding-top: 10px"
            >
              <p style="font-weight: bold; color: var(--primary-color)">
                No Payment Required
              </p>
              <p style="font-size: 14px; color: var(--text-secondary)">
                Start translating your website for free. Upgrade anytime to
                unlock more features.
              </p>
            </div>
            <!-- Paid tier - payment method section -->
            <div v-else class="payment">
              <div
                v-if="defaultPaymentMethod && !creating_new_method"
                style="padding-top: 10px"
              >
                <PaymentMethods label="Payment Method" />
                <button
                  class="btn btn-link"
                  v-if="!creating_new_method"
                  @click="creating_new_method = true"
                >
                  Add New Payment Method
                </button>
              </div>
              <div
                v-if="!defaultPaymentMethod || creating_new_method"
                :style="!initial_onboard_setup ? 'padding-top: 10px;' : ''"
              >
                <button
                  class="btn btn-link"
                  v-if="defaultPaymentMethod"
                  @click="creating_new_method = false"
                >
                  <ArrowLeft
                    style="
                      display: inline-flex;
                      justify-content: center;
                      align-items: center;
                      margin-right: 5px;
                    "
                  />
                  back
                </button>
                <CreatePaymentMethod
                  from="finalize_checkout"
                  :product="product"
                  :price="price"
                  :addons="selected_addon_products"
                  :domain="domain"
                  :selected_languages="selected_languages"
                  :coupon_code="coupon_code"
                  :initial_onboard_setup="initial_onboard_setup"
                  :setup_your_plan_initial_onboard_step="
                    setup_your_plan_initial_onboard_step
                  "
                  :is_switching="current_subscription ? true : false"
                  :current_subscription_id="
                    current_subscription ? current_subscription.id : null
                  "
                  :prorate="prorate"
                  :is_free_update="is_free_update"
                  :plan_comparison="planComparison ? planComparison : null"
                />
              </div>
            </div>
            <div class="pricing">
              <div class="overview" v-if="realCost">
                <div>
                  <div class="centered">
                    <p>
                      <span
                        v-if="!discountAmount || coupon.duration === 'once'"
                      >
                        ${{ parseFloat(price.unit_amount).toFixed(2) }} /
                        <span class="small-text">{{
                          price.recurring.interval
                        }}</span>
                      </span>
                      <span v-else>
                        <span class="discounted-interval">
                          ${{
                            parseFloat(
                              price.unit_amount - discountAmount
                            ).toFixed(2)
                          }}
                        </span>
                        <del
                          >${{ parseFloat(price.unit_amount).toFixed(2) }}</del
                        >
                        /
                        <span class="small-text">{{
                          price.recurring.interval
                        }}</span>
                        <span class="small-text promo-code">
                          ({{ coupon.promotion_code }})
                          <span
                            v-if="coupon.duration_in_months"
                            class="small-text coupon-duration"
                            >* active for
                            {{ coupon.duration_in_months }} months</span
                          ></span
                        >
                      </span>
                    </p>
                    <p
                      v-if="
                        selected_addon_products &&
                        selected_addon_products.length > 0
                      "
                    >
                      <span
                        v-for="addonProduct in selected_addon_products"
                        :key="addonProduct.id"
                      >
                        <span
                          v-if="
                            addonProduct.billing_type &&
                            addonProduct.billing_type !== 'usage'
                          "
                        >
                          {{ selectCorrectAddonPrice(addonProduct) }}
                        </span>
                      </span>
                    </p>
                    <p v-if="prorationPreview" class="left-a-bit">
                      <span class="larger-text"> - </span>
                      ${{
                        parseFloat(prorationPreview.inverted_amount).toFixed(2)
                      }}
                      <span class="small-text"> (Prorated Cost)</span>
                    </p>

                    <p
                      v-if="discountAmount && coupon.duration === 'once'"
                      class="left-a-bit"
                    >
                      <span class="larger-text"> - </span>
                      ${{ parseFloat(discountAmount).toFixed(2) }}
                      <span class="small-text">
                        ({{ coupon.promotion_code }})</span
                      >
                    </p>
                  </div>
                </div>
                <hr />

                <p v-if="!calculating_real_cost" class="total centered">
                  <span>
                    <span
                      v-if="
                        planComparison == null ||
                        (planComparison && planComparison.type === 'upgrade')
                      "
                    >
                      ${{ realCost }}
                    </span>
                    <span v-else> $0 </span>

                    <span class="small-text"> Due Today</span>
                  </span>
                  <span class="actual-price-description">
                    <span>
                      Then ${{ parseFloat(price.unit_amount).toFixed(2) }} /
                      {{ price.recurring.interval }}
                    </span>
                    <span
                      class="usage-based-addon-description"
                      v-if="
                        selected_addon_products &&
                        selected_addon_products.length > 0
                      "
                    >
                      <span
                        v-for="addonProduct in selected_addon_products"
                        :key="addonProduct.id"
                      >
                        <span
                          v-if="
                            addonProduct.billing_type &&
                            addonProduct.billing_type === 'usage'
                          "
                        >
                          + ${{
                            parseFloat(
                              selectCorrectAddonPrice(addonProduct).unit_amount
                            ).toFixed(2)
                          }}
                          per event (<span class="small-text">{{
                            addonProduct.name
                          }}</span
                          >)
                        </span>
                      </span>
                    </span>
                  </span>
                </p>
                <p v-else class="total centered">
                  <svg
                    class="spinning"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z"
                    />
                  </svg>
                </p>
              </div>
            </div>
            <div
              :class="[
                'coupon',
                { 'hide-coupon-box': !initial_onboard_setup || isFreeTier },
              ]"
            >
              <label for="coupon_code">Coupon Code</label>
              <div class="coupon-input-group">
                <LlInput
                  v-model="coupon_code"
                  name="coupon_code"
                  id="coupon_code"
                />
                <span
                  class="validation-error"
                  v-if="serverCouponValidationErrors.length > 0"
                >
                  <p v-for="error in serverCouponValidationErrors" :key="error">
                    {{ error }}
                  </p>
                </span>
                <button
                  :class="[
                    'btn',
                    'btn-outline',
                    { 'btn-disabled': discountAmount },
                  ]"
                  @click="validateCouponCode"
                >
                  <span v-if="!validatingCoupon">
                    <span v-if="!discountAmount"> Add </span>
                    <span v-else> Added! </span>
                  </span>
                  <span v-else>
                    <div class="loading-spinner-inline"></div>
                  </span>
                </button>
              </div>
            </div>
            <!-- create-payment-method component handles checkout interally -->
            <div class="checkout-button">
              <!-- Free tier checkout - no payment method required -->
              <button
                class="btn btn-primary btn-highlight"
                v-if="isFreeTier"
                @click="
                  current_subscription && isFreeTier
                    ? downgradeToFree()
                    : handleFreeCheckout()
                "
              >
                <span v-if="!loading">
                  <span v-if="current_subscription && isFreeTier">
                    Confirm Changes
                  </span>
                  <span v-else> Get Started Free </span>
                </span>
                <span v-else> Loading... </span>
              </button>
              <!-- Paid checkout with existing payment method -->
              <button
                class="btn btn-primary btn-highlight"
                v-else-if="!creating_new_method && defaultPaymentMethod"
                @click="
                  current_subscription ? handleUpdate() : handleCheckout()
                "
              >
                <span v-if="!loading">
                  <span
                    v-if="
                      planComparison == null ||
                      (planComparison && planComparison.type === 'upgrade')
                    "
                  >
                    Complete Purchase
                  </span>
                  <span v-else> Confirm Changes </span>
                </span>
                <span v-else> Loading... </span>
              </button>
            </div>
          </div>
        </div>
        <div class="loading-overlay" v-if="loading">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p v-if="loadingProrationDiscount" style="font-weight: bold">
              Loading Proration Discount...
            </p>
            <p v-else style="font-weight: bold">Finalizing purchase...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  computed,
  ref,
  watch,
  watchEffect,
  defineExpose,
  onUnmounted,
} from "vue"
import { useAuthStore } from "../../stores/auth"
import { useSubscriptionStore } from "../../stores/subscription"
import { useCheckoutStore } from "../../stores/checkout"
import { useAccountStore } from "../../stores/account"
import { useThemeStore } from "../../stores/theme"
import { useLicenseStore } from "../../stores/license"
import SelectionPreview from "./partials/SelectionPreview.vue"
import ProductPreview from "./partials/ProductPreview.vue"
import PaymentMethods from "./partials/PaymentMethods.vue"
import CreatePaymentMethod from "./partials/CreatePaymentMethod.vue"
import LlInput from "../Root/Input/LlInput.vue"
import LlButton from "../Root/Button/LlButton.vue"
import ChevronUp from "vue-material-design-icons/ChevronUp.vue"
import ChevronDown from "vue-material-design-icons/ChevronDown.vue"
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue"
import Swal from "sweetalert2"
import { gtag_report_conversion } from "../../utils/analytics.js"
import { useRoute, useRouter } from "vue-router"

export default {
  name: "FinalizeCheckout",
  props: {
    product: {
      type: Object,
      default: null,
    },
    price: {
      type: Object,
      default: null,
    },
    selected_billing_term: {
      type: Boolean,
      default: false,
    },
    current_subscription: {
      type: Object,
      default: null,
    },
    is_free_update: {
      type: Boolean,
      default: false,
    },
    current_subscription_product: {
      type: Object,
      default: null,
    },
    initial_onboard_setup: {
      type: Boolean,
      default: true,
    },
    addon_products: {
      type: Array,
      default: [],
    },
    domain: {
      type: String,
      default: null,
    },
    selected_domain: {
      type: Boolean,
      default: false,
    },
    language_limit: {
      type: Number,
      required: true,
    },
    selected_languages: {
      type: Array,
      default: [],
    },
    languages_saved: {
      type: Boolean,
      default: false
    },
    setup_your_plan_initial_onboard_step: {
      //used to mark as completed from frontend
      type: Object,
      default: null,
    },
  },
  components: {
    SelectionPreview,
    ProductPreview,
    PaymentMethods,
    CreatePaymentMethod,
    LlButton,
    LlInput,
    ChevronUp,
    ChevronDown,
    ArrowLeft,
  },
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const checkoutStore = useCheckoutStore()
    const subscriptionStore = useSubscriptionStore()
    const accountStore = useAccountStore()
    const licenseStore = useLicenseStore()
    const themeStore = useThemeStore()

    const show = ref(false)
    const calculating_real_cost = ref(false)
    const coupon_code = ref(null)
    const prorate = ref(false)
    const selected_addon_products = ref([])
    const addonPrices = ref([])
    const creating_new_method = ref(false)
    const couponValidationTimeout = ref(null)

    const route = useRoute()
    const router = useRouter()

    const isEmbedded = computed(() => themeStore.isEmbedded)

    //computed
    const loading = computed(() => {
      return (
        checkoutStore.state.loading.subscription_update ||
        checkoutStore.state.loading.payment_method ||
        checkoutStore.state.loading.checkout ||
        checkoutStore.state.loading.creating_payment_method ||
        checkoutStore.state.loading.subscription_proration_preview ||
        subscriptionStore.state.loading.subscriptions ||
        subscriptionStore.state.loading.subscription_domain
      )
    })

    const validatingCoupon = computed(() => {
      return checkoutStore.state.loading.subscription_coupon_discount
    })

    const loadingProrationDiscount = computed(() => {
      return checkoutStore.state.loading.subscription_proration_preview
    })

    const checkoutProduct = computed(() => {
      return (
        props.product &&
        props.price &&
        props.selected_domain &&
        props.languages_saved
      )
    })

    // Check if selected product is free tier (no payment required)
    const isFreeTier = computed(() => {
      return (
        props.product?.is_free_tier === true ||
        props.product?.name?.toLowerCase() === "free"
      )
    })

    const defaultPaymentMethod = computed(() => {
      if (accountStore.state.default_payment_method) {
        return accountStore.state.default_payment_method
      }
    })

    const prorationPreview = computed(() => {
      if (
        subscriptionStore.state.subscription_proration_preview &&
        subscriptionStore.state.subscription_proration_preview > 0
      ) {
        prorate.value = true
        return {
          amount: parseFloat(
            subscriptionStore.state.subscription_proration_preview
          ).toFixed(2),
          inverted_amount: parseFloat(
            props.price.unit_amount -
              subscriptionStore.state.subscription_proration_preview
          ).toFixed(2),
        }
      } else {
        prorate.value = false
        return null
      }
    })

    const realCost = computed(() => {
      calculating_real_cost.value = true
      let realCost = 0
      if (prorationPreview.value) {
        realCost += parseFloat(prorationPreview.value.amount)
      } else {
        realCost += parseInt(props.price.unit_amount)
      }

      if (checkoutStore.state.subscription_coupon_discount) {
        realCost -= parseFloat(checkoutStore.state.subscription_coupon_discount)
      }

      calculating_real_cost.value = false

      return parseFloat(realCost).toFixed(2)
    })

    const coupon = computed(() => {
      return checkoutStore.state.coupon
    })

    const planComparison = computed(() => {
      if (!props.current_subscription_product || !props.product) {
        return null
      }

      const planLevels = {
        Free: 1,
        Starter: 2,
        Growth: 3,
        Pro: 4,
        Enterprise: 5,
      }

      const currentLevel = planLevels[props.current_subscription_product.name]
      const selectedLevel = planLevels[props.product.name]

      if (currentLevel === undefined || selectedLevel === undefined) {
        console.warn("Unknown plan name detected", {
          current: props.current_subscription_product.name,
          selected: props.product.name,
        })
        return null
      }

      if (selectedLevel > currentLevel) {
        return {
          type: "upgrade",
          from: props.current_subscription_product.name,
          to: props.product.name,
          fromLevel: currentLevel,
          toLevel: selectedLevel,
        }
      } else if (selectedLevel < currentLevel) {
        return {
          type: "downgrade",
          from: props.current_subscription_product.name,
          to: props.product.name,
          fromLevel: currentLevel,
          toLevel: selectedLevel,
        }
      } else {
        return {
          type: "same",
          from: props.current_subscription_product.name,
          to: props.product.name,
          fromLevel: currentLevel,
          toLevel: selectedLevel,
        }
      }
    })

    const serverCouponValidationErrors = computed(() => {
      return checkoutStore.state.coupon_validation_errors
    })

    const discountAmount = computed(() => {
      return checkoutStore.state.subscription_coupon_discount
    })

    //methods
    function getScrubbedLanguages() {
      // We use map to create a new array. For each language object,
      // we use object destructuring with rest parameters to create a new object
      // that includes all properties except for 'flag'.
      return props.selected_languages.map(({ flag, ...rest }) => rest)
    }

    function handleHeaderClick() {
      if (loading.value) return
      show.value = !show.value
    }

    function closeDialog() {
      if (loading.value) return
      show.value = false
    }

    function attachInitialOnboardCoupon() {
      if (props.product.name == "Starter") {
        coupon_code.value = "WELCOME-1s"
      }

      if (props.product.name == "Growth") {
        coupon_code.value = "WELCOME-1g"
      }

      if (props.product.name == "Pro") {
        coupon_code.value = "WELCOME-1p"
      }
    }

    function validateCouponCode() {
      checkoutStore.validateCouponCode({
        coupon_code: coupon_code.value,
        price_id: props.price.id,
      })
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

      if (
        selected_addon_products.value &&
        selected_addon_products.value.length > 0
      ) {
        //select out correct pricing if applicable
        selected_addon_products.value.forEach((addonProduct) => {
          addonPrices.push(selectCorrectAddonPrice(addonProduct).id)
        })
      }

      addonPrices.value = addonPrices
    }

    function handleCheckout() {
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
          coupon_code: coupon_code.value,
          free_trial: false,
          addon_prices: addonPrices.value,
        })
        .then((res) => {
          if (res && (res.data.success || parseInt(res.data.success) === 1)) {
            // Check if upgrading from a free license
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
              // New subscription - create new license
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
                      license_key: newLicenseResponse.data.license.license_key,
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
              // Redirect to upgrade success if upgrading from free
              if (props.is_free_update) {
                router.push({ path: "/success-confirmation/upgrade" })
              } else {
                router.push({ path: "/success-confirmation/purchase" })
              }
            }
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
    }

    /**
     * Handle free tier license creation (no payment required)
     */
    function handleFreeCheckout() {
      // Get the first selected language (free tier only allows 1)
      const language = props.selected_languages[0]?.code

      if (!language) {
        Swal.fire({
          title: "Error",
          text: "Please select a language",
          icon: "error",
          confirmButtonText: "Ok",
        })
        return
      }

      checkoutStore
        .handleCreateFreeLicense({
          domain: props.domain,
          language: language,
          account_id: authStore.currentAccountId,
        })
        .then((res) => {
          if (res && res.data && res.data.success) {
            // If embedded, save the new free license to WordPress options
            if (
              window.WebLinguistDashboard?.isEmbedded &&
              res.data.license
            ) {
              licenseStore.saveLicenseToWordPress({
                license_id: res.data.license.id,
                license_key: res.data.license.license_key,
              })
            }

            // Refresh subscriptions to show new free license
            subscriptionStore.getSubscriptions({
              account_id: authStore.currentAccountId,
            })

            // Mark onboarding step as complete if applicable
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
                    path: "/success-confirmation/free-tier",
                  })
                })
            } else {
              router.push({ path: "/success-confirmation/free-tier" })
            }
          } else {
            Swal.fire({
              title: "Error",
              text:
                res?.data?.error || "Something went wrong. Please try again",
              icon: "error",
              confirmButtonText: "Ok",
            })
          }
        })
        .catch((err) => {
          const errorMessage =
            err?.response?.data?.error ||
            "Something went wrong. Please try again"
          Swal.fire({
            title: "Error",
            text: errorMessage,
            icon: "error",
            confirmButtonText: "Ok",
          })
        })
    }

    function handleUpdate() {
      buildAddonPricesArray()

      checkoutStore
        .handleUpdateSubscription({
          new_price: props.price.id,
          account_id: authStore.currentAccountId,
          subscription_id: props.current_subscription.id,
          prorate: prorate.value,
          name: props.product.name,
          coupon: coupon_code.value,
          payment_method_stripe_id:
            accountStore.state.default_payment_method.stripe_method_id,
          addon_prices: addonPrices.value,
        })
        .then((res) => {
          if (res && (res.data.success || parseInt(res.data.success) === 1)) {
            subscriptionStore
              .saveSubscriptionDetails({
                account_id: authStore.currentAccountId,
                subscription_id: props.current_subscription.id,
                domain: props.domain,
                translations: getScrubbedLanguages(),
              })
              .then(() => {
                subscriptionStore.getSubscriptions({
                  account_id: authStore.currentAccountId,
                })

                const isUpgrade =
                  planComparison.value &&
                  planComparison.value.type === "upgrade"

                isUpgrade
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
              text: `Error Code: ${err.response?.data?.decline_code}`,
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
    }

    function downgradeToFree() {
      subscriptionStore
        .downgradeToFree(
          {
            license_id: props.current_subscription.license.id,
          },
          authStore
        )
        .then((res) => {
          if (res && res.data && res.data.success) {
            subscriptionStore.getSubscriptions({
              account_id: authStore.currentAccountId,
            })
            licenseStore.getLicenses()
            router.push({ path: "/success-confirmation/downgrade-to-free" })
          } else {
            Swal.fire({
              title: "Error",
              text:
                res?.data?.error || "Something went wrong. Please try again",
              icon: "error",
              confirmButtonText: "Ok",
            })
          }
        })
        .catch((err) => {
          Swal.fire({
            title: "Error",
            text: "Something went wrong. Please try again",
            icon: "error",
            confirmButtonText: "Ok",
          })
        })
    }

    //watchers
    watchEffect(() => {
      if (
        checkoutProduct.value &&
        show.value &&
        props.current_subscription == null
      ) {
        attachInitialOnboardCoupon()
      }
    })

    watch(show, (newValue) => {
      emit("showOverlay", show.value)
      if (newValue) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = ""
      }
    })

    watch(coupon_code, (newValue) => {
      console.log("coupon_code", coupon_code.value)
      console.log("newval", newValue)
      if (newValue) {
        // Clear existing timeout
        if (couponValidationTimeout.value) {
          clearTimeout(couponValidationTimeout.value)
        }

        // Set new timeout to validate after user stops typing
        couponValidationTimeout.value = setTimeout(() => {
          if (newValue && newValue.trim().length > 0) {
            validateCouponCode()
          } else {
            checkoutStore.setCouponDiscount(null)
            checkoutStore.setCoupon(null)
            coupon_code.value = null
          }
        }, 500) // Wait 500 miliseconds after user stops typing
      }
    })

    watch(
      [() => props.current_subscription, () => props.price],
      ([newSubscription, newPrice]) => {
        console.log("Subscription or Price changed:", newSubscription, newPrice)

        checkoutStore.setCouponDiscount(null)
        checkoutStore.setCoupon(null)
        coupon_code.value = null

        if (newSubscription && newPrice && !isFreeTier.value) {
          subscriptionStore.previewUpdateProration({
            subscription_id: newSubscription.id,
            new_price: newPrice.id,
            account_id: authStore.currentAccountId,
          })
        }
      }
    )

    onUnmounted(() => {
      document.body.style.overflow = ""
    })

    // Expose the handleHeaderClick method to be callable from the parent component
    defineExpose({
      handleHeaderClick,
    })

    return {
      loading,
      loadingProrationDiscount,
      checkoutProduct,
      show,
      discountAmount,
      coupon,
      coupon_code,
      serverCouponValidationErrors,
      validatingCoupon,
      addonPrices,
      selected_addon_products,
      realCost,
      defaultPaymentMethod,
      creating_new_method,
      prorationPreview,
      planComparison,
      //methods
      handleHeaderClick,
      validateCouponCode,
      handleCheckout,
      handleFreeCheckout,
      handleUpdate,
      isFreeTier,
      closeDialog,
      isEmbedded,
      downgradeToFree,
      //components
      SelectionPreview,
      ProductPreview,
      LlButton,
      LlInput,
      PaymentMethods,
      CreatePaymentMethod,
      ChevronUp,
      ChevronDown,
      ArrowLeft,
    }
  },
}
</script>
<style>
.finalize-checkout.is-embedded {
  width: initial;
}
.finalize-checkout {
  position: fixed;
  bottom: 0px;
  width: 100%;
  background: white;
  border: 1px solid #929292;
  border-radius: 20px 20px 0 0;
  box-shadow: 0px 0px 80px #929292;
  transform: translateY(70px);
  transition: transform 0.15s ease-in-out;
}
.finalize-checkout.has-content {
  transform: translateY(0px);
  z-index: 101;
}
.finalize-checkout-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 15px;
  border-bottom: 1px solid #929292;
  cursor: pointer;
}
.finalize-checkout-top p {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}
.finalize-checkout-top .expand-drawer-cta {
  font-size: 18px;
  font-weight: 500;
  color: white;
  background-color: var(--accent-color);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 7.5px;
  border-radius: 2rem;
  margin-left: 1rem;
}
.finalize-checkout-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.finalize-checkout-bottom .segment {
  width: 50%;
  padding: 30px 10px;
}
.finalize-checkout-bottom .segment.selection-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.finalize-checkout-bottom .segment.selection-details div.product-preview {
  padding: 0 40px 30px 40px;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details {
  margin: 0 50px;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details
  .addon-selection-details-title {
  font-size: 18px;
  font-weight: bold;
  color: #696969;
  border-bottom: 1px dashed #ddd;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details
  span {
  position: relative;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details
  .addon-selected
  button {
  border: 1px solid;
  border-radius: 4px;
  border-color: #27ae60;
  color: #27ae60;
  background-color: #b9efd0;
  font-weight: bolder;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details
  .addon-info {
  position: absolute;
  top: -10px;
  left: -15px;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details
  button
  .selected-indicator {
  position: absolute;
  transform: translateX(15px);
  color: #27ae60;
  visibility: hidden;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.addon-selection-details
  .addon-selected
  button
  .selected-indicator {
  visibility: visible;
}
.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details {
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0 40px 30px 40px;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  p.selected-domain {
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  p.selected-domain
  .domain-label {
  font-weight: 500;
  margin-right: 5px;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  p.selected-domain
  .domain-value {
  text-decoration: underline;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  ul.selected-languages {
  list-style: none;
  padding: 0;
  display: inline-flex;
  margin-top: 20px;
  width: max-content;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  ul.selected-languages::-webkit-scrollbar {
  width: 10px;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  ul.selected-languages::-webkit-scrollbar-track {
  background-color: transparent;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  ul.selected-languages::-webkit-scrollbar-thumb {
  background-color: #ddd;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  ul.selected-languages
  li {
  margin-right: 15px;
  margin-bottom: 5px;
  padding: 5px 15px;
  font-size: 12px;
  min-width: 70px;
  border-radius: 50px;
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
}

.finalize-checkout-bottom
  .segment.selection-details
  div.checkout-selection-details
  ul.selected-languages
  li {
  margin-right: 5px;
}

.finalize-checkout-bottom .segment:nth-child(2) {
  border-left: 1px solid #929292;
}
.finalize-checkout-bottom .payment-details {
  display: grid;
  grid-template-areas:
    "payment pricing"
    "coupon checkout-button";
  grid-gap: 10px;
}
#transition-container {
  position: relative;
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.45s ease-in-out;
}
#transition-container.has-content {
  max-height: 90vh;
}
.double-chevron-up,
.double-chevron-down {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.double-chevron-up svg,
.double-chevron-down svg {
  width: 35px;
  height: 35px;
}
.double-chevron-up svg {
  fill: #27ae60;
}
.double-chevron-down svg {
  fill: #e74c3c;
  transform: rotate(180deg);
}
.arrow-icon-container {
  margin: 0 7.5px;
}
.a-link {
  padding: 0 !important;
  border: none !important;
  color: #66b1ff !important;
}
.payment {
  grid-area: payment;
  padding-top: 25px;
  text-align: left;
  /* position: relative; */
}
.pricing {
  align-self: center;
  grid-area: pricing;
}
.pricing .promo-code {
  position: relative;
}
.pricing .coupon-duration {
  position: absolute;
  top: -25px;
  right: 0;
  width: max-content;
  font-weight: 400;
}
.coupon {
  position: relative;
  grid-area: coupon;
  text-align: left;
}
.coupon.hide-coupon-box {
  visibility: hidden;
  height: 0;
}
.coupon .coupon-input-group {
  display: grid;
  grid-template-columns: 70% 30%;
}
.coupon .coupon-input-group input {
}
.coupon .coupon-input-group button {
  margin: 0 20px 0 20px !important;
}
.discounted-interval {
  position: absolute;
  top: 0;
}
.pricing .overview {
  padding: 25px 10px;
  font-size: 16px;
  position: relative;
  font-weight: 600;
}
.pricing .overview .total {
  font-size: 1.4em;
}
.pricing .overview hr {
  border-top: 2px solid black;
}
.pricing .centered {
  justify-self: center;
}
.pricing .actual-price-description {
  font-size: 14px;
  color: #696969;
  display: block;
  margin-top: 5px;
  font-weight: 400;
}
.pricing .usage-based-addon-description {
  display: block;
}
.pricing .left-a-bit {
  margin-left: -13px;
}
.pricing .small-text {
  font-size: 11px;
}
.pricing .larger-text {
  font-size: 18px;
  font-weight: bold;
}
.checkout-button {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  grid-area: checkout-button;
}
.checkout-button button {
  padding: 15px 25px !important;
  font-size: 18px;
  font-weight: 400;
  border-radius: 35px !important;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.validation-error {
  color: #e74c3c;
  font-size: 12px;
  position: absolute;
  top: 0;
  right: 15px;
}
/* .checkout-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
}
.checkout-loading-overlay svg {
  width: 45px;
  height: 45px;
} */
@media screen and (max-width: 1550px) {
  .coupon .coupon-input-group,
  .payment {
  }
  .pricing {
  }
  .pricing hr {
  }
}
@media screen and (max-width: 1250px) {
  .finalize-checkout-bottom {
    flex-direction: column !important;
  }
  .finalize-checkout-bottom .segment.selection-details {
    padding-bottom: 0 !important;
  }
  .finalize-checkout-bottom .segment.selection-details div.product-preview {
    padding: 0 !important;
  }
  .finalize-checkout-bottom
    .segment.selection-details
    div.checkout-selection-details {
    padding: 0;
    margin-top: 25px;
  }
  .segment {
    width: 100% !important;
  }
  .finalize-checkout-bottom .segment.selection-details .selection-preview {
    justify-content: center;
  }
  .finalize-checkout-bottom
    .segment.selection-details
    div.addon-selection-details {
    margin: 0 15px;
  }
}
@media screen and (max-width: 769px) {
  .hide-on-mobile {
    display: none !important;
  }
}
@media screen and (max-width: 550px) {
  .finalize-checkout-bottom .segment.selection-details .product-preview,
  .finalize-checkout-bottom .segment.selection-details .selection-preview {
    display: none !important;
  }
  .finalize-checkout-bottom
    .segment.selection-details
    div.checkout-selection-details {
    margin-top: 0;
  }
  .finalize-checkout-bottom .segment:nth-child(2) {
    border-left: none !important;
  }
  .coupon .coupon-input-group button {
    margin: 0 5% 0 5% !important;
  }
  .payment-details {
    grid-template-columns: 1fr !important;
    grid-template-areas:
      "pricing"
      "coupon"
      "payment"
      "checkout-button" !important;
  }
  .overview,
  .payment {
    padding: 0 !important;
  }
  .finalize-checkout-top p {
    font-size: 18px;
  }
}
</style>
