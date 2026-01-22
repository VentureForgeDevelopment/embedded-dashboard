<template>
  <div class="checkout-container">
    <div :class="['checkout-top', 'max-1200', 'padding', {'flex-center': current_subscription_product}]" v-if="initialOnboardComplete">
      <div v-if="!lock_billing_term && !isFreeTierSelected" class="billing-term-wrapper">
        <!-- months:false / years:true -->
        <div>
          <span class="interval" style="margin: 0 5px">Monthly</span>
          <LlSwitch
            v-model="billing_term"
            name="billing_term"
            id="billing_term"
            big
          />
          <span class="interval" style="margin: 0 5px">Yearly</span>
        </div>
      </div>
      <div class="enterprise-plan-cta">
        <p>
          Discover how Web Linguist can deliver secure, scalable, and compliant translation solutions tailored to your organization’s global growth.
          <a href="https://weblinguist.ai/specialist/" target="_blank">Connect with a specialist</a>
        </p>
      </div>
    </div>
    <div
      :class="[
        'checkout-content-wrapper',
        { 'is-onboarding': !initialOnboardComplete },
      ]"
    >
      <WalkthroughContainer
        v-if="!initialOnboardComplete && isEmbedded"
        mode="static"
        :static-steps="['Sign Up', 'Setup Your Plan', 'Translate Your Website']"
        :current-static-step-index="1"
      />
      <WalkthroughContainer v-else-if="!initialOnboardComplete" />
      <div :class="['selection-setup-container', 'padding', {'max-1200': initialOnboardComplete}]">

        <div v-if="current_subscription_product" class="section-container current-plan-container">
          <div class="section-title">
            <span>Current Plan: {{ current_subscription_product.name }}</span>
            <!-- <details class="features-dropdown">
              <summary>View Features</summary>
              <ul class="features-list">
                <li v-for="(feature, index) in current_product_features" :key="index">{{ feature }}</li>
              </ul>
           </details> -->
          </div>
        </div>

        <div
          :class="[
            'section-container',
            {
              'section-container-collapsed':
                currentSelectedProduct && currentSelectedPrice,
            },
            {
              'collapse-width':
                currentSelectedProduct && currentSelectedPrice,
            },
          ]"
        >
          <p class="section-title">
            <p 
              class="section-title-text"
            >
              <span v-if="current_subscription_product">Select A New Plan</span>
              <span v-else>Select a Plan</span>

              <CheckCircleIcon 
                v-if="currentSelectedProduct"
                fill-color="var(--success-green)" 
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                  margin-left:0.5rem;
                " 
              />
            </p>
            <span class="selection" v-if="currentSelectedProduct">
              <span v-if="isFreeTierSelected">
                {{ currentSelectedProduct.name }}
              </span>
              <span v-else-if="initialOnboardComplete">
                {{ currentSelectedProduct.name }} -- <span class="price">${{currentSelectedPrice?.unit_amount}} / {{ currentSelectedPrice?.recurring.interval }}</span>
              </span>
              <span v-else>
                {{ currentSelectedProduct.name }} -- <span class="price">{{showDiscountedPrice(currentSelectedPrice)}}</span>
              </span>
            </span>
            <span class="icon-wrapper" v-if="currentSelectedProduct">
              <Close
                fill-color="gray"
                class="close-icon"
                @click="editSelectedProduct()"
                aria-label="reset product selection"
              />
            </span>
          </p>
          <div class="section-content products-wrapper">
            <div v-if="loading.checkout_products || loading.subscriptions" class="loading-container">
              <span class="loading-spinner"></span>
              <p>Loading products...</p>
            </div>
            <CheckoutProduct
              v-for="product in visibleProducts"
              :key="product.id"
              :product="product"
              :selected_product="currentSelectedProduct"
              :selected_price="currentSelectedPrice"
              :selected_billing_term="billing_term"
              :show_individual_prices="initialOnboardComplete ? false : true"
              @productSelected="selectedProduct"
            />
          </div>
        </div>

        <div
          :class="[
            'section-container',
            { disabled: !currentSelectedProduct },
            { 'section-container-collapsed': domain && selected_domain },
            {
              'collapse-width':
                domain && selected_domain,
            },
          ]"
        >
        <div class="domain-input-wrapper">
          <label for="domain_input" class="section-title">
            <p class="section-title-text">
              <span v-if="current_subscription_product">Domain</span>
              <span v-else>Add Domain</span>

              <CheckCircleIcon
                v-if="domain && selected_domain"
                fill-color="var(--success-green)"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                  margin-left: 0.5rem;
                "
              />
            </p>
            <span class="selection" v-if="domain && selected_domain">
              {{ domain }}
            </span>
            <span class="icon-wrapper" v-if="domain && selected_domain && !isEmbedded">
              <Pencil
                fill-color="gray"
                class="edit-icon"
                @click="editSelectedDomain()"
                aria-label="edit domain"
              />
            </span>
          </label>
          <div
            v-if="currentSelectedProduct"
            class="domain-select-wrapper section-content"
          >
          <!-- selectedDomain updates from select btn -->
          <DomainSelect
            v-model="domain"
            v-model:selectedDomain="selected_domain" 
            :show-select-btn="true"
          />
          </div>
        </div>
          
        </div>

        <div
          :class="[
            'section-container',
            { disabled: !currentSelectedProduct && !selected_domain },
            {
              'section-container-collapsed':
                selected_languages.length >= languageLimit && languageLimit,
            },
            {
              'collapse-width':
                selected_languages.length >= languageLimit && languageLimit,
            },
          ]"
        >
        <div>
          <label for="language_select" class="section-title">
            <p class="section-title-text">
              <span v-if="current_subscription_product">Adjust Translations</span>
              <span v-else>Select Translations</span>

              <CheckCircleIcon
                v-if="isLanguageLimitReached"
                fill-color="var(--success-green)"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                  margin-left: 0.5rem;
                "
              />
            </p>
            <span class="selection" v-if="isLanguageLimitReached">
              <ul>
                <li v-for="language in selected_languages" :key="language.code">
                  {{ language.code }} <span class="flag-icon" v-html="language.flag"></span>
                </li>
              </ul>
            </span>
            <span class="icon-wrapper" v-if="isLanguageLimitReached">
              <Pencil
                fill-color="gray"
                class="edit-icon"
                @click="editSelectedLanguages()"
                aria-label="edit selected languages"
              />
            </span>
          </label>
        </div>
          <LanguageSelect
            v-if="currentSelectedProduct && selected_domain"
            v-model="selected_languages"
            :language-limit="languageLimit"
          />
        </div>
      </div>
    </div>

    <div
      :class="{ 'finalize-checkout-overlay': show_overlay }"
      @click="handleOverlayClick()"
    ></div>

    <FinalizeCheckout
      ref="finalizeCheckout"
      :product="currentSelectedProduct"
      :price="currentSelectedPrice"
      :selected_billing_term="billing_term"
      :current_subscription="subscription"
      :is_free_update="isFreeUpgrade"
      :initial_onboard_setup="initialOnboardComplete"
      :setup_your_plan_initial_onboard_step="
        setupYourPlanInitialOnboardStepObject
      "
      :current_subscription_product="current_subscription_product"
      @showOverlay="handleShowOverlay"
      :addon_products="addonProducts"
      :domain="domain"
      :selected_domain="selected_domain"
      :language_limit="languageLimit"
      :selected_languages="selected_languages"
    />
  </div>
</template>

<script>
import { computed, ref, watch, onMounted, nextTick } from "vue"
import { useAuthStore } from "../stores/auth"
import { useCheckoutStore } from "../stores/checkout"
import { useSubscriptionStore } from "../stores/subscription"
import { useAccountStore } from "../stores/account"
import { useLicenseStore } from "../stores/license"
import { useThemeStore } from "../stores/theme"
import DomainSelect from "../components/DomainSelect.vue"
import LanguageSelect from "../components/LanguageSelect.vue"
import WalkthroughContainer from "../components/Checkout/partials/WalkthroughContainer.vue"
import CheckoutProduct from "../components/Checkout/CheckoutProduct.vue"
import FinalizeCheckout from "../components/Checkout/FinalizeCheckout.vue"
import LlSwitch from "../components/Root/Switch/LlSwitch.vue"
import LlInput from "../components/Root/Input/LlInput.vue"
import CheckCircleIcon from "vue-material-design-icons/CheckCircle.vue"
import Pencil from "vue-material-design-icons/Pencil.vue"
import Close from "vue-material-design-icons/Close.vue"

export default {
  name: "CheckoutView",
  props: {
    type: {
      type: String,
      default: null
    },
    id: {
      type: Number,
      default: null
    }
  },
  components: {
    WalkthroughContainer,
    CheckoutProduct,
    FinalizeCheckout,
    LlSwitch,
    LlInput,
    DomainSelect,
    LanguageSelect,
    //icons
    CheckCircleIcon,
    Pencil,
    Close,
  },
  setup(props) {
    const authStore = useAuthStore()
    const checkoutStore = useCheckoutStore()
    const subscriptionStore = useSubscriptionStore()
    const accountStore = useAccountStore()
    const licenseStore = useLicenseStore()
    const themeStore = useThemeStore()

    //data
    const selected_product = ref(null)
    const selected_price = ref(null)
    const initial_product_name = ref("Starter")
    const billing_term = ref(false)
    const lock_billing_term = ref(false)
    const show_overlay = ref(false)
    const finalizeCheckout = ref(null)
    const domain = ref("")
    const selected_domain = ref(false)
    const selected_languages = ref([])
    const subscription = ref(null)
    const current_subscription_product = ref(null)
    const current_product_features = ref(null)
    const isFreeUpgrade = ref(false)

    const isEmbedded = computed(() => themeStore.isEmbedded)

    const initialOnboardComplete = computed(() => {
      return authStore.initialOnboardComplete
    })

    const setupYourPlanInitialOnboardStepObject = computed(() => {
      if (!initialOnboardComplete.value) {
        return accountStore.state.initial_onboard_steps[1]
      } else {
        return null
      }
    })

    const languageLimit = computed(() => {
      if (!currentSelectedProduct.value) {
        return 0 // No languages can be selected until a plan is chosen
      }
      const productName = currentSelectedProduct.value.name.toLowerCase()
      if (productName.includes("free")) {
        return 1 // Free tier: 1 language only
      }
      if (productName.includes("starter")) {
        return 1
      }
      if (productName.includes("growth")) {
        return 3
      }
      if (productName.includes("pro")) {
        return 5
      }
      return 1 // Default fallback
    })

    const showLanguageWarning = computed(() => {
      return (
        !currentSelectedProduct.value && selected_languages.value.length > 0
      )
    })

    const subscriptions = computed(() => {
      return subscriptionStore.state.subscriptions
    })

    // const subscriptionItems = computed(() => {
    //   if (!subscription.value) return []
    //   return subscription.value.items
    // })

    const currentSelectedProduct = computed(() => {
      return selected_product.value
    })

    const currentSelectedPrice = computed(() => {
      return selected_price.value
    })

    const loading = computed(() => {
      return checkoutStore.state.loading
    })

    const checkoutProducts = computed(() => {
      return checkoutStore.state.checkout_products
    })

    const addonProducts = computed(() => {
      return checkoutStore.state.addon_products
    })

    const visibleProducts = ref([])

    const isLanguageLimitReached = computed(() => {
      return (
        languageLimit.value > 0 &&
        selected_languages.value.length >= languageLimit.value
      )
    })

    const isFreeTierSelected = computed(() => {
      if (!currentSelectedProduct.value) return false
      return currentSelectedProduct.value.is_free_tier ||
             currentSelectedProduct.value.name?.toLowerCase() === 'free'
    })

    //watchers
    watch(isEmbedded, (embedded) => {
      if (embedded) {
        domain.value = window.location.hostname
        selected_domain.value = true
      }
    }, {
      immediate: true
    })

    watch(languageLimit, (newLimit) => {
      if (selected_languages.value.length > newLimit) {
        selected_languages.value.splice(newLimit)
      }
    })

    watch(billing_term, (newTerm) => {
      let termName = newTerm ? "year" : "month"

      if (selected_product.value) {
        selected_price.value = selected_product.value.prices.find(
          (price) => price.recurring.interval === termName
        )
      }
    })

    watch(selected_languages, (newLanguages) => {
      if (
        newLanguages.length === languageLimit.value &&
        selected_domain.value
      ) {
        popFinalizeCheckout()
      }
    })

    watch(selected_domain, (newDomain) => {
      if (
        selected_languages.value.length === languageLimit.value &&
        newDomain
      ) {
        popFinalizeCheckout()
      }
    })

    watch(subscriptions, (newSubscriptions) => {
      setupSubscriptionDetails()
    })

    watch(checkoutProducts, (newProducts) => {
      visibleProducts.value = filterCurrentProductFromCheckout()
    })

    watch(() => props.type, (newType) => { 
      isFreeUpgrade.value = newType === 'upgrade-free'
    }, { immediate: true })

    //methods
    function filterCurrentProductFromCheckout() {
      if (!initialOnboardComplete.value) {
        // For free signup users during onboarding, show both Free and Starter products
        const isFreeUser = authStore.isFreeUser
        if (isFreeUser) {
          // Show Free product first, then Starter
          return checkoutProducts.value.filter((product) => {
            return product.is_free_tier ||
                   product.name?.toLowerCase() === 'free' ||
                   product.name === initial_product_name.value
          })
        }

        // For non-free users, show only the initial product (Starter)
        let initialProduct = checkoutProducts.value.filter((product) => {
          if (product.name === initial_product_name.value) {
            return product
          }
        })

        return initialProduct
      }

      // Handle upgrade-free: show all paid products (exclude free)
      if (props.type === 'upgrade-free') {
        // isFreeUpgrade is now handled by its own watcher
        return checkoutProducts.value.filter(product => {
          return !product.is_free_tier && product.name?.toLowerCase() !== 'free'
        })
      }

      // If no subscription, return all checkout products
      if (
        !subscription.value ||
        subscription.value === undefined ||
        typeof subscription.value !== "object" ||
        subscription.value.length === 0 ||
        !subscription.value.type
      ) {
        return checkoutProducts.value
      }

      // Use the order of keys in checkout_products_features to establish rank.
      const productRankOrder = Object.keys(checkoutStore.state.checkout_products_features)
      const currentRank = productRankOrder.findIndex(
        (name) => name.toLowerCase() === subscription.value.type.toLowerCase()
      )

      // Set the current subscription product for display purposes.
      current_subscription_product.value = checkoutProducts.value.find(
        (p) => p.name === subscription.value.type
      )

      // If we can't determine the current rank, return no products to avoid confusion.
      if (currentRank === -1) {
        return []
      }

      return checkoutProducts.value.filter(product => {
        const productRankValue = productRankOrder.findIndex(
          (name) => name.toLowerCase() === product.name.toLowerCase()
        );
        if (productRankValue === -1 || productRankValue === currentRank) return false

        if (props.type === 'upgrade') return productRankValue > currentRank
        if (props.type === 'downgrade') return productRankValue < currentRank
        return true // Default case: show all other products if no type is specified
      });
    }

    function selectedProduct(product, price) {
      selected_product.value = product
      selected_price.value = price
    }

    function editSelectedProduct() {
      selected_product.value = null
      selected_price.value = null
    }

    function editSelectedDomain() {
      if (isEmbedded.value) return
      domain.value = ""
      selected_domain.value = false
    }

    function handleShowOverlay(value) {
      show_overlay.value = value
    }

    function handleOverlayClick() {
      show_overlay.value = false
      finalizeCheckout.value?.handleHeaderClick()
    }

    function popFinalizeCheckout() {
      if (
        selected_product.value &&
        domain.value &&
        selected_domain.value &&
        selected_languages.value.length === languageLimit.value
      ) {
        show_overlay.value = true
        finalizeCheckout.value?.handleHeaderClick()
      }
    }

    function editSelectedLanguages() {
      showLanguageWarning.value = false
      selected_languages.value = []
    }

    function removeSelectedLanguage(language) {
      selected_languages.value = selected_languages.value.filter(
        (l) => l !== language
      )
    }

    function setupSubscriptionDetails() {
      if (props.type && props.id && subscriptions.value.length > 0) {

        subscription.value = subscriptions.value.find(
          (sub) => sub.id === parseInt(props.id)
        )

        //lock billing term to previous interval for proration
        if ( subscription.value?.interval === 'year') {
          billing_term.value = true //true = yearly interval
        }

        current_product_features.value = checkoutStore.state.checkout_products_features[subscription.value?.type]

        if (subscription.value) {
          lock_billing_term.value = true
          if (!isEmbedded.value) {
            domain.value = subscription.value.license.domain_name
            selected_domain.value = true
          }

          const translations = subscription.value.license.settings.languages
          if (typeof translations === 'string') {
            try {
              selected_languages.value = JSON.parse(translations)
            } catch (e) {
              console.error("Failed to parse subscription translations:", e);
              selected_languages.value = []
            }
          } else {
            selected_languages.value = translations || []
          }
        }
      }
    }

    function setupFreeLicenseUpgrade() {
      // Wait for licenses to load, then prefill domain and language from free license
      const licenseId = parseInt(props.id)
      const unsubLicense = watch(() => licenseStore.state.licenses, (licenses) => {
        if (licenses && licenses.length > 0) {
          const existingLicense = licenses.find(l => l.id === licenseId)
          if (existingLicense) {
            // Prefill domain
            if (existingLicense.domain_name && !isEmbedded.value) {
              domain.value = existingLicense.domain_name
              selected_domain.value = true
            }
            // Prefill language from settings
            const settings = existingLicense.settings
            if (settings && settings.languages) {
              try {
                const langs = typeof settings.languages === 'string'
                  ? JSON.parse(settings.languages)
                  : settings.languages
                if (Array.isArray(langs) && langs.length > 0) {
                  selected_languages.value = langs
                }
              } catch (e) {
                console.error('Failed to parse license languages:', e)
              }
            }
          }
          nextTick(() => {
            unsubLicense(); // Stop watching after prefill
          });
        }
      }, { immediate: true })

      // Set current_subscription_product to show "Current Plan: Free"
      const unsubProducts = watch(checkoutProducts, (products) => {
        if (products && products.length > 0) {
          const freeProduct = products.find(p =>
            p.is_free_tier || p.name?.toLowerCase() === 'free'
          )
          if (freeProduct) {
            current_subscription_product.value = freeProduct
          }
          nextTick(() => {
            unsubProducts(); // Stop watching after setting
          });
        }
      }, { immediate: true })
    }

    function showDiscountedPrice(selectedPrice) {
      if (
        currentSelectedProduct.value?.is_free_tier ||
        currentSelectedProduct.value?.name?.toLowerCase() === "free"
      ) {
        return "Free Forever!";
      }
      if (selectedPrice.recurring.interval === "month") {
        return '$1 for your first month!'
      } else {
        return '$109 for your first year!'
      }
    }

    //on mounted
    onMounted(() => {
      // Check if user is a free_signup user to show free product option
      const isFreeUser = authStore.isFreeUser
      checkoutStore.getCheckoutProducts(isFreeUser)

      // Load licenses to detect existing free license for upgrade flow
      licenseStore.getLicenses()

      if (subscriptions.value && subscriptions.value.length > 0) {
        setupSubscriptionDetails()
      }

      // Check for plan query parameter (from free registration flow)
      const urlParams = new URLSearchParams(window.location.search)
      const planParam = urlParams.get('plan')

      if (planParam === 'free') {
        // Wait for products to load, then pre-select the free product
        const unsub = watch(checkoutProducts, (products) => {
          if (products && products.length > 0) {
            const freeProduct = products.find(p =>
              p.is_free_tier || p.name?.toLowerCase() === 'free'
            )
            if (freeProduct) {
              // Pre-select the free product with its first price
              const freePrice = freeProduct.prices?.[0] || null
              selectedProduct(freeProduct, freePrice)
            }
            unsub() // Stop watching after selection
          }
        }, { immediate: true })
      }

      // Handle upgrade-free route type (upgrading from free license to paid)
      if (props.type === 'upgrade-free' && props.id) {
        setupFreeLicenseUpgrade()
      }
    })

    return {
      loading,
      visibleProducts,
      addonProducts,
      currentSelectedProduct,
      currentSelectedPrice,
      current_subscription_product,
      current_product_features,
      selected_product,
      selected_price,
      billing_term,
      initialOnboardComplete,
      setupYourPlanInitialOnboardStepObject,
      subscription,
      domain,
      selected_languages,
      languageLimit,
      showLanguageWarning,
      selected_domain,
      show_overlay,
      lock_billing_term,
      isLanguageLimitReached,
      isFreeTierSelected,
      isFreeUpgrade,
      isEmbedded,
      //refs
      finalizeCheckout,
      //methods
      selectedProduct,
      editSelectedProduct,
      editSelectedDomain,
      handleShowOverlay,
      handleOverlayClick,
      editSelectedLanguages,
      removeSelectedLanguage,
      showDiscountedPrice,
      //components
      DomainSelect,
      LanguageSelect,
      WalkthroughContainer,
      CheckoutProduct,
      FinalizeCheckout,
      LlSwitch,
      LlInput,
      //icons
      CheckCircleIcon,
      Pencil,
      Close,
    }
  },
}
</script>

<style scoped>
.checkout-container {
  animation: fadeIn 0.3s ease;
}
.checkout-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 40px 15%;
  margin-bottom: 20px;
}

.enterprise-plan-cta{
  padding-left: 2rem;
  text-align: left;
}
.checkout-top.flex-center{
  justify-content: center!important;
}
.billing-term-wrapper div {
  display: flex;
}
.billing-wrapper div .interval {
  margin: 0 5px !important;
}
.checkout-top .current-product-wrapper .current-product-title {
  margin-bottom: 0;
  margin-right: 10px;
  font-weight: bold;
  font-size: 24px;
}
.checkout-top .current-product-wrapper span {
  margin-right: 20px;
}
.checkout-top .current-product-wrapper .current-product-dropdown-wrapper {
  padding: 10px;
  background: white;
  border-radius: 20px;
}
.checkout-content-wrapper.is-onboarding {
  display: grid;
  grid-template-columns: 35% 65%;
}

.selection-setup-container{
}

.selection-setup-container .section-container:nth-child(1) {
  margin-top:0!important;
}

.checkout-content-wrapper.is-onboarding .selection-setup-container {
  padding-top: 20vh !important;
  /* padding: 2rem; */
}
.products-wrapper {
  display: grid;
  gap: 1rem; /* Sets space between grid items */
  /* Creates as many columns as will fit; each will be a minimum of 200px */
  /* and expand equally to fill the row (1fr) */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
}

.checkout-content-wrapper.is-onboarding .products-wrapper{
  display: block;
}

/* .domain-input-wrapper {
  width: 100%;
} */

.current-product-feature{
  font-size:1rem;
  font-weight: 400;
  margin:0 1rem;
}

.current-plan-container {
  width: max-content;
}

.current-plan-container .section-title {
  display: flex;
  margin-bottom:0;
  justify-content: space-between;
  align-items: center;
}

.features-dropdown {
  position: relative;
  margin-left: 1rem;
  font-size: 1rem;
}

.features-dropdown summary {
  cursor: pointer;
  font-weight: 500;
  list-style: none; /* Hide the default marker */
}

.features-dropdown summary::-webkit-details-marker {
  display: none; /* Hide the default marker in Chrome */
}

.features-dropdown .features-list {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  list-style: none;
  z-index: 10;
  margin-top: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.language-select-wrapper label {
  text-align: left;
  display: block;
}

.section-title .selection ul {
  display: flex;
  flex-direction: row;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
}
.section-title .selection ul li {
  margin-left: 10px;
  font-size: 16px;
  min-width: 80px;
  width: max-content;
  display:inline-flex;
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

.validation-error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  text-align: left;
  margin-top: 0.25rem;
}
.finalize-checkout-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.65);
  transition: all 0.35s ease-in-out;
}
@media screen and (max-width: 769px) {
  .checkout-content-wrapper.is-onboarding {
    display: block;
  }

  .checkout-content-wrapper.is-onboarding .selection-setup-container {
    padding-top: 4rem !important;
  }

  .checkout-top {
    padding: 25px 10%;
    flex-direction: column-reverse;
    gap: 1.5rem;
  }

  .domain-select-wrapper {
    flex-direction: column;
  }
}
@media screen and (max-width: 525px) {
  .checkout-top {
    padding: 25px;
  }
}
</style>
