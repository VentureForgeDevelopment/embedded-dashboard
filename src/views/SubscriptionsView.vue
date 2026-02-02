<template>
  <div class="subscriptions-container max-1200 padding">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading subscriptions...</p>
    </div>

    <div v-else>
      <div
        v-if="subscriptions && subscriptions.length > 0"
        class="subscriptions-switch-wrapper"
      >
        <p class="subscriptions-switch-title">Viewing: All Subscriptions</p>
        <ul>
          <li>
            <a href="#" class="subscription-link subscription-link-all active">All</a>
          </li>
          <li v-for="subscription in subscriptions" :key="subscription.id">
            <a
              href="#"
              class="subscription-link truncate-text"
              v-if="subscription.license"
              @click.prevent="goToSubscriptionDetail(subscription.id)"
              >{{ subscription.license.domain_name }}</a
            >
          </li>
        </ul>
      </div>

      <div v-if="subscriptions && subscriptions.length > 0">
        <div class="subscriptions-content-top">
          <div class="section-container">
            <div v-if="!creatingNewMethod" class="payment-methods-wrapper">
              <PaymentMethods label="Default Payment Method" />
              <button
                @click.prevent="creatingNewMethod = true"
                :class="[
                  'btn',
                  'btn-primary',
                  'create-new-method-button',
                  {
                    'btn-disabled':
                      accountRole === 'Read Only' || accountRole === 'User',
                  },
                ]"
              >
                Create New Payment Method
                <PlusCircleOutline
                  style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-left: 10px;
                  "
                />
              </button>
            </div>
            <div v-if="creatingNewMethod" class="create-payment-method-wrapper">
              <button
                @click.prevent="creatingNewMethod = false"
                class="btn-link back-button"
              >
                <ArrowLeft
                  style="
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    margin-right: 5px;
                  "
                />
                Back
              </button>
              <CreatePaymentMethod
                @paymentMethodCreated="creatingNewMethod = false"
              />
            </div>
          </div>
          <div class="purchase-subscription-container">
            <button
              v-if="accountRole !== 'Read Only' && showPurchaseBtn"
              class="btn btn-primary"
              @click="goToCheckoutPage"
            >
              Create a Subscription
              <Plus
                size="20"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                  margin-left: 5px;
                "
              />
            </button>
          </div>
        </div>
        <!-- Invoices -->
        <div v-if="invoices && invoices.length > 0">
          <Invoices
            :invoices="invoices"
            :upcoming_invoices="upcomingInvoices"
            :subscriptions="subscriptions"
          />
        </div>
        <div v-else>
          <p>No invoices found.</p>
        </div>
      </div>
      <div v-else>
        <div class="full-page-cta">
          <h1>No Subscriptions Yet!</h1>
          <p>No subscriptions found. Please create a new subscription.</p>
          <button v-if="accountRole !== 'Read Only' && showPurchaseBtn" class="btn btn-primary" @click="goToCheckoutPage">
            Purchase a Subscription
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue"
import { useAuthStore } from "../stores/auth"
import { useSubscriptionStore } from "../stores/subscription"
import { useThemeStore } from "../stores/theme"
import { useLicenseStore } from "../stores/license"
import Invoices from "../components/Subscriptions/Invoices.vue"
import { useRouter } from "vue-router"
import PaymentMethods from "../components/Checkout/partials/PaymentMethods.vue"
import CreatePaymentMethod from "../components/Checkout/partials/CreatePaymentMethod.vue"
import PlusCircleOutline from "vue-material-design-icons/PlusCircleOutline.vue"
import Plus from "vue-material-design-icons/Plus.vue"
import ArrowLeft from "vue-material-design-icons/ArrowLeft.vue"

export default {
  name: "SubscriptionsView",
  components: {
    Invoices,
    PaymentMethods,
    CreatePaymentMethod,
    PlusCircleOutline,
    Plus,
    ArrowLeft,
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const subscriptionStore = useSubscriptionStore()
    const themeStore = useThemeStore()
    const licenseStore = useLicenseStore()

    const isEmbedded = computed(() => {
      return themeStore.isEmbedded
    })

    const licenses = computed(()=> {
      return licenseStore.state.value?.licenses
    })

    const showPurchaseBtn = computed(() => {
      // Show the button if the app is not embedded.
      if (!isEmbedded.value) {
        return true;
      }

      return false
    });

    const creatingNewMethod = ref(false)

    //computed
    const accountRole = computed(() => authStore.currentAccountRole)
    const loading = computed(
      () =>
        subscriptionStore.state.loading.subscriptions ||
        subscriptionStore.state.loading.subscription_payment_method ||
        subscriptionStore.state.loading.invoices ||
        subscriptionStore.state.loading.subscription_domain
    )
    const subscriptions = computed(() => subscriptionStore.state.subscriptions)
    const invoices = computed(() => subscriptionStore.state.invoices)
    const upcomingInvoices = computed(
      () => subscriptionStore.state.upcoming_invoices
    )

    //methods
    const goToSubscriptionDetail = (subscriptionId) => {
      router.push({ path: `/subscriptions/${subscriptionId}` })
    }

    const goToCheckoutPage = () => {
      router.push({ path: "/checkout" })
    }

    return {
      showPurchaseBtn,
      accountRole,
      creatingNewMethod,
      subscriptions,
      invoices,
      upcomingInvoices,
      loading,
      //methods
      goToSubscriptionDetail,
      goToCheckoutPage,
      //components
      Invoices,
      PaymentMethods,
      CreatePaymentMethod,
      PlusCircleOutline,
      ArrowLeft,
      Plus,
    }
  },
}
</script>

<style scoped>
.subscriptions-container {
  animation: fadeIn 0.3s ease;
}

.subscriptions-content-top {
  display: flex;
  justify-content: space-between;
}

.subscriptions-content-top .section-container {
  width: 50%;
}

.subscriptions-content-top
  .section-container
  :deep(.payment-methods-wrapper label) {
  display: flex;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  justify-content: flex-start;
  margin: 0 0 1rem 0;
}

.subscriptions-content-top
  .section-container
  .payment-methods-wrapper
  .create-new-method-button {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  background-color: transparent;
  color: var(--accent-color);
  padding: 1px;
}

.subscriptions-content-top .section-container .create-payment-method-wrapper {
  text-align: left;
}

.subscriptions-content-top
  .section-container
  .create-payment-method-wrapper
  .back-button {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.subscriptions-content-top .purchase-subscription-container {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  margin-top: 40px;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .subscriptions-content-top {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .subscriptions-content-top .section-container {
    width: 100%;
    margin-bottom: 2rem;
  }

  .subscriptions-content-top
    .section-container
    .payment-methods-wrapper
    .create-new-method-button {
    justify-content: center;
    width: 100%;
    margin-top: 1rem;
  }
}
</style>
