<template>
  <div class="subscriptions-container max-1200 padding">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading subscription...</p>
    </div>
    <div v-else>
      <div v-if="subscription" class="subscriptions-switch-wrapper">
        <p
          class="subscriptions-switch-title"
          v-if="subscription && subscription.license"
        >
          Viewing: {{ subscription.license.domain_name }}
        </p>
        <ul>
          <li v-if="!isShopifyPlatform">
            <a
              href="#"
              @click.prevent="goToAllSubscriptions"
              class="subscription-link subscription-link-all"
              >All</a
            >
          </li>
          <li v-for="subscription in subscriptionsForSwitcher" :key="subscription.id">
            <a
              href="#"
              @click.prevent="goToSubscriptionDetail(subscription.id)"
              :class="[
                'subscription-link', 'truncate-text',
                { active: subscription.id === selectedSubscriptionId },
              ]"
              v-if="subscription && subscription.license"
              >{{ subscription.license.domain_name }}</a
            >
          </li>
        </ul>
      </div>

      <!-- Current Plan -->
      <div v-if="subscription">
        <div class="plan-card subscription-plan-card">
          <div class="plan-header">
            <div>
              <h3 class="plan-name">{{ subscription.type === 'Starter' ? 'Standard' : subscription.type }} 
                Plan
                <span v-if="subscription.ends_at" class="subscription-ends-at-date">
                  Ends at: {{ formatDate(subscription.ends_at) }}
                </span>
              </h3>
              <div class="plan-price">
                <span class="price">${{ parseFloat(price).toFixed(2) }}</span>
                <span class="period">/ {{ resolvedInterval }}</span>
              </div>
            </div>
            <div v-if="isShopifyPlatform" class="shopify-billing-container">
              <p class="shopify-billing-label">Billing via Shopify</p>
              <a
                :href="'https://' + shopDomain + '/admin/settings/billing'"
                target="_top"
                class="btn btn-outline shopify-billing-link"
              >
                Manage Billing in Shopify Admin
              </a>
            </div>
            <div v-else class="payment-methods-container">
              <PaymentMethods
                :subscription="subscription"
                label="Payment Method"
                @hasMethod="paymentMethod = $event"
              />
            </div>
          </div>
          <div class="plan-footer">
            <div class="plan-features">
              <div
                v-for="feature in productFeatures"
                :key="feature"
                class="feature-item"
              >
                <Check
                  fill-color="green"
                  style="
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    margin-right: 0.5rem;
                  "
                />
                {{ feature }}
              </div>
            </div>
            <div class="plan-actions">
              <button
                v-if="subscription.type != 'Pro'"
                :class="[
                  'btn',
                  'btn-primary',
                  { 'btn-disabled': accountRole === 'Read Only' },
                ]"
                @click="pushToCheckoutUprade"
              >
                Upgrade Plan
              </button>
              <button
                v-if="canDowngrade"
                :class="[
                  'btn',
                  'btn-outline',
                  { 'btn-disabled': accountRole === 'Read Only' },
                ]"
                @click="pushToCheckoutDowngrade"
              >
                Downgrade Plan
              </button>
              <button
                v-if="!isShopifyPlatform"
                :class="[
                  'btn',
                  'btn-outline',
                  { 'btn-disabled': accountRole === 'Read Only' || subscription.ends_at !== null},
                ]"
                @click="confirmCancelSubscription"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <template v-if="!isShopifyPlatform">
          <div v-if="invoices && invoices.length">
            <Invoices
              :invoices="invoices"
              :upcoming_invoices="upcomingInvoices"
              :subscriptions="[subscription]"
              :account_id="subscription.account_id"
              :payment_method="paymentMethod"
            />
          </div>
          <div v-else>
            <p>No Invoices Found</p>
          </div>
        </template>
      </div>
      <div v-else>
        <div class="full-page-cta">
          <h1>No Subscription Found</h1>
          <p>Sorry, we couldn't find the subscription you're looking for.</p>
          <button class="btn btn-primary" @click="goToAllSubscriptions">
            Go to All Subscriptions
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watchEffect, onMounted } from "vue"
import { useAuthStore } from "../stores/auth"
import { useSubscriptionStore } from "../stores/subscription"
import { useCheckoutStore } from "../stores/checkout"
import { useThemeStore } from "../stores/theme"
import { useLicenseStore } from "../stores/license"
import Invoices from "../components/Subscriptions/Invoices.vue"
import Swal from "sweetalert2"
import { useRouter } from "vue-router"
import PaymentMethods from "../components/Checkout/partials/PaymentMethods.vue"
import Check from "vue-material-design-icons/Check.vue"
import moment from "moment"

export default {
  name: "SubscriptionDetail",
  components: {
    Invoices,
    PaymentMethods,
    Check,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()
    const authStore = useAuthStore()
    const subscriptionStore = useSubscriptionStore()
    const checkoutStore = useCheckoutStore()
    const themeStore = useThemeStore()
    const licenseStore = useLicenseStore()

    const invoices = ref([])
    const upcomingInvoices = ref([])
    const paymentMethod = ref(null)

    //computed
    const accountRole = computed(() => authStore.currentAccountRole)
    const isEmbedded = computed(() => themeStore.isEmbedded)
    const isShopifyPlatform = computed(() => window.WebLinguistDashboard?.platform === 'shopify')
    const shopDomain = computed(() => window.WebLinguistDashboard?.shopDomain || '')
    const activeLicense = computed(() => licenseStore.state.active_license)

    const loading = computed(
      () =>
        subscriptionStore.state.loading.subscriptions ||
        subscriptionStore.state.loading.invoices ||
        subscriptionStore.state.loading.subscription_domain
    )

    const loadingPaymentMethod = computed(() => {
      return subscriptionStore.state.loading.subscription_payment_method
    })

    const selectedSubscriptionId = computed(() => parseInt(props.id))

    const subscriptions = computed(() => subscriptionStore.state.subscriptions)

    const subscriptionsForSwitcher = computed(() => {
      if (isEmbedded.value && subscriptions.value) {
        if (activeLicense.value && activeLicense.value.subscription_id) {
          return subscriptions.value.filter(
            (sub) => sub.id === activeLicense.value.subscription_id
          )
        }
        return [] // Don't show any other subscriptions in embedded mode if no active one
      }
      return subscriptions.value
    })

    const subscription = computed(() => {
      if (
        subscriptionStore.state.subscriptions &&
        subscriptionStore.state.subscriptions.length > 0
      ) {
        let currentSubscription = subscriptionStore.state.subscriptions.find(
          (sub) => sub.id === parseInt(props.id)
        )
        return currentSubscription
      } else {
        return null
      }
    })

    /**
     * Resolve the Shopify subscription interval from the synthetic stripe_price.
     * e.g. "shopify_standard_monthly" → "month", "shopify_growth_yearly" → "year"
     * Falls back to the subscription's interval field for Stripe subscriptions.
     */
    const resolvedInterval = computed(() => {
      if (!subscription.value) return null
      if (isShopifyPlatform.value && subscription.value.stripe_price) {
        if (subscription.value.stripe_price.endsWith('_yearly')) return 'year'
        if (subscription.value.stripe_price.endsWith('_monthly')) return 'month'
      }
      return subscription.value.interval || null
    })

    /**
     * Resolve the subscription price.
     * For Shopify subscriptions, the items don't carry a price amount (the backend can't
     * retrieve Stripe prices for synthetic IDs), so we look up the matching checkout product
     * using the shopifyPriceToStripeProductMap and match the interval.
     */
    const price = computed(() => {
      if (!subscription.value) return 0

      // For Shopify, resolve price from checkout products
      if (isShopifyPlatform.value && subscription.value.stripe_price) {
        const productName = checkoutStore.shopifyPriceToStripeProductMap[subscription.value.stripe_price]
        if (productName) {
          const product = checkoutStore.state.checkout_products.find(p => p.name === productName)
          if (product && product.prices) {
            const interval = resolvedInterval.value
            const matchingPrice = product.prices.find(
              p => p.recurring && p.recurring.interval === interval
            )
            if (matchingPrice) return matchingPrice.unit_amount
          }
        }
      }

      // Default: sum from subscription items (Stripe subscriptions)
      let total = 0
      if (subscription.value.items) {
        subscription.value.items.forEach((item) => {
          total += parseFloat(item.price).toFixed(2)
        })
      }
      return total
    })

    const productFeatures = computed(() => {
      // Resolve product name using Shopify price map when applicable
      let type = subscription.value.type
      if (window.WebLinguistDashboard?.platform === 'shopify' && subscription.value.stripe_price) {
        const mappedName = checkoutStore.shopifyPriceToStripeProductMap[subscription.value.stripe_price]
        if (mappedName) {
          type = mappedName
        }
      } else if (type === 'Standard') {
        type = 'Starter'
      }
      return checkoutStore.state.checkout_products_features[type]
    })

    // Check if user can downgrade (either to lower paid tier OR to free if they're a free_signup user)
    const canDowngrade = computed(() => {
      if (!subscription.value) return false
      // Resolve plan type for Shopify using the price map
      let planType = subscription.value.type?.toLowerCase()
      if (window.WebLinguistDashboard?.platform === 'shopify' && subscription.value.stripe_price) {
        const mappedName = checkoutStore.shopifyPriceToStripeProductMap[subscription.value.stripe_price]
        if (mappedName) {
          planType = mappedName.toLowerCase()
        }
      }
      // Users on Growth or Pro can always downgrade to a lower paid tier
      if (planType === 'growth' || planType === 'pro') return true
      // Starter/Standard users can only downgrade if they're free_signup users (can go to Free tier)
      if (planType === 'starter' && authStore.isFreeUser) return true
      return false
    })

    const pushToCheckoutUprade = () => {
      router.push({ path: `/checkout/upgrade/${subscription.value.id}` })
    }

    const pushToCheckoutDowngrade = () => {
      router.push({ path: `/checkout/downgrade/${subscription.value.id}` })
    }

    // Load checkout products for Shopify price resolution
    onMounted(() => {
      if (isShopifyPlatform.value && checkoutStore.state.checkout_products.length === 0) {
        checkoutStore.getCheckoutProducts()
      }
    })

    //watchers
    watchEffect(async () => {
      if (subscription.value) {
        invoices.value = subscriptionStore.state.invoices.filter(
          (invoice) => invoice.subscription_id === subscription.value.stripe_id
        )
        upcomingInvoices.value =
          subscriptionStore.state.upcoming_invoices.filter(
            (invoice) =>
              invoice.subscription_id === subscription.value.stripe_id
          )
      }
    })

    //methods

    function goToAllSubscriptions() {
      router.push({ path: "/subscriptions" })
    }

    function goToSubscriptionDetail(id) {
      router.push({ path: `/subscriptions/${id}` })
    }

    const formatDate = (date) => {
      return moment(date).format("MMM D, YYYY")
    }

    function confirmCancelSubscription() {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        input: "checkbox",
        inputLabel: "Cancel immediately",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, cancel it!",
      })
        .then((result) => {
          if (result && result.value === 1) {
            subscriptionStore
              .cancelSubscription({
                subscription_id: subscription.value.id,
                immediately: true,
              })
              .then((res) => {
                if (
                  res &&
                  (res.data.success || parseInt(res.data.success) === 1)
                ) {
                  Swal.fire({
                    title: "Cancelled!",
                    text: "Your subscription has been cancelled.",
                    icon: "success",
                    confirmButtonText: "Ok",
                  })
                  router.push({ path: "/subscriptions" })

                  subscriptionStore.getSubscriptions({
                    account_id: subscription.value.account_id,
                  })
                } else {
                  Swal.fire({
                    title: "Error",
                    text: "There was an issue cancelling your subscription. Please try again.",
                    icon: "error",
                    confirmButtonText: "Ok",
                  })
                }
              })
          } else if (result && result.value === 0) {
            subscriptionStore
              .cancelSubscription({
                subscription_id: subscription.value.id,
                immediately: false,
              })
              .then((res) => {
                if (
                  res &&
                  (res.data.success || parseInt(res.data.success) === 1)
                ) {
                  Swal.fire({
                    title: "Cancelled!",
                    text: "Your subscription has been set to cancel at the end of your billing cycle.",
                    icon: "success",
                    confirmButtonText: "Ok",
                  })
                  subscriptionStore.getSubscriptions({
                    account_id: subscription.value.account_id,
                  })
                } else {
                  Swal.fire({
                    title: "Error",
                    text: "There was an issue cancelling your subscription. Please try again.",
                    icon: "error",
                    confirmButtonText: "Ok",
                  })
                }
              })
          }
        })
        .catch((error) => {
          console.error(error)
          Swal.fire({
            title: "Error",
            text: "There was an issue cancelling your subscription. Please try again.",
            icon: "error",
            confirmButtonText: "Ok",
          })
        })
    }

    return {
      accountRole,
      isShopifyPlatform,
      shopDomain,
      loading,
      loadingPaymentMethod,
      subscriptions,
      subscriptionsForSwitcher,
      subscription,
      price,
      resolvedInterval,
      productFeatures,
      canDowngrade,
      invoices,
      upcomingInvoices,
      selectedSubscriptionId,
      paymentMethod,
      pushToCheckoutUprade,
      pushToCheckoutDowngrade,
      //methods
      goToAllSubscriptions,
      goToSubscriptionDetail,
      confirmCancelSubscription,
      formatDate,
      //components
      Invoices,
      PaymentMethods,
      Check,
    }
  },
}
</script>

<style scoped>
.subscriptions-container {
  animation: fadeIn 0.3s ease;
}

.subscription-plan-card {
  margin-top: 2rem;
}

.subscription-ends-at-date{
  font-size: 14px;
    background: var(--caution-red);
    padding: 0.5rem;
    border-radius: 20px;
    color: var(--text-tertiary);
    font-weight: 400;
}

.plan-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.shopify-billing-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.shopify-billing-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.shopify-billing-link {
  display: inline-flex;
  align-items: center;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .plan-header,
  .plan-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }

  .plan-actions {
    flex-direction: column;
  }

  .plan-features {
    grid-template-columns: 1fr;
  }
}
</style>
