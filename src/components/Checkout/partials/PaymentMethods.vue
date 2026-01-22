<template>
  <div v-if="paymentMethods.length > 0">
    <SlideInNotification
      :show="showSuccessNotification"
      message="Payment method updated successfully"
      type="success"
    />
    <SlideInNotification
      :show="showFailNotification"
      message="Failed to update payment method"
      type="error"
    />
    <SlideInNotification
      :show="showGenericFailNotification"
      message="An error occurred"
      type="error"
    />

    <label :for="`payment_methods_${uniqueId}`">{{ label }}</label>
    <div class="payment-methods-wrapper">
      <select
        :disabled="accountRole === 'Read Only' || accountRole === 'User'"
        :id="`payment_methods_${uniqueId}`"
        @change="
          !subscription
            ? updateDefaultPaymentMethod($event.target.value)
            : updateSubscriptionPaymentMethod($event.target.value)
        "
      >
        <option value="" selected disabled hidden>
          {{ selectedMethodText }}
        </option>
        <option
          v-for="item in sortedPaymentMethods"
          :key="item.id"
          :label="'XXXXXXXXXXXX' + item.last4"
          :value="item.stripe_method_id"
          :disabled="item.id === currentMethodId"
        ></option>
      </select>
      <span v-if="loading">
        <div class="loading-spinner-inline"></div>
      </span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue"
import { useAuthStore } from "../../../stores/auth"
import { useAccountStore } from "../../../stores/account"
import { useSubscriptionStore } from "../../../stores/subscription"
import SlideInNotification from "../../SlideInNotification.vue"

export default {
  name: "PaymentMethods",
  props: {
    label: {
      type: String,
      default: "Default Payment Method",
    },
    subscription: {
      // This is the subscription object for a specific subscription
      type: Object,
      default: null,
    },
    defineEmits: ["hasMethod"],
  },
  components: {
    SlideInNotification,
  },
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const accountStore = useAccountStore()
    const subscriptionStore = useSubscriptionStore()

    const currentMethodId = ref(null)
    const uniqueId = Math.random().toString(36).substring(2, 9)

    const showSuccessNotification = ref(false)
    const showFailNotification = ref(false)
    const showGenericFailNotification = ref(false)

    //computed
    const accountRole = computed(() => authStore.currentAccountRole)

    const loading = computed(() => {
      return (
        accountStore.state.loading.payment_method ||
        accountStore.state.loading.payment_methods ||
        subscriptionStore.state.loading.subscription_payment_method
      )
    })

    const paymentMethods = computed(() => {
      return accountStore.state.payment_methods
    })

    const sortedPaymentMethods = computed(() => {
      const methods = [...paymentMethods.value]
      const currentId = currentMethodId.value

      if (!currentId) {
        return methods
      }

      const currentIndex = methods.findIndex(
        (method) => method.id === currentId
      )

      // If the current method is found and it's not already the first item
      if (currentIndex > 0) {
        const [currentItem] = methods.splice(currentIndex, 1)
        methods.unshift(currentItem)
      }

      return methods
    })

    const defaultPaymentMethod = computed(() => {
      return accountStore.state.default_payment_method
    })

    const selectedMethodText = computed(() => {
      if (props.subscription) {
        const paymentMethod = paymentMethods.value.find(
          (method) =>
            method.id === parseInt(props.subscription.payment_method_id)
        )
        if (paymentMethod) {
          return "XXXXXXXXXXXX" + paymentMethod.last4
        }
      } else if (defaultPaymentMethod.value) {
        return "XXXXXXXXXXXX" + defaultPaymentMethod.value.last4
      } else {
        return "Select a payment method"
      }
    })

    // watchers
    watch(
      () => [props.subscription, defaultPaymentMethod.value],
      () => {
        if (props.subscription) {
          currentMethodId.value = parseInt(props.subscription.payment_method_id)
        } else if (defaultPaymentMethod.value) {
          currentMethodId.value = defaultPaymentMethod.value.id
        }
      },
      { immediate: true }
    )

    //hooks
    onMounted(() => {
      if (props.subscription) {
        const paymentMethod = paymentMethods.value.find(
          (method) =>
            method.id === parseInt(props.subscription.payment_method_id)
        )
        emit("hasMethod", paymentMethod)
      } else if (defaultPaymentMethod.value) {
        emit("hasMethod", defaultPaymentMethod.value)
      }
    })

    function updateDefaultPaymentMethod(method_id) {
      const paymentMethod = paymentMethods.value.find(
        (method) => method.stripe_method_id === method_id
      )
      if (paymentMethod) {
        currentMethodId.value = paymentMethod.id
        emit("hasMethod", paymentMethod)
      }

      accountStore
        .updateDefaultPaymentMethod({
          account_id: authStore.currentAccountId,
          payment_method: method_id,
          new_method: false, // Should be false when selecting an existing method
        })
        .then((res) => {
          if (res && (res.data.success || parseInt(res.data.success) === 1)) {
            showSuccessNotification.value = true
            setTimeout(() => {
              showSuccessNotification.value = false
            }, 3000)
          } else {
            showFailNotification.value = true
            setTimeout(() => {
              showFailNotification.value = false
            }, 3000)
          }
        })
        .catch((err) => {
          showGenericFailNotification.value = true
          setTimeout(() => {
            showGenericFailNotification.value = false
          }, 3000)
        })
    }

    function updateSubscriptionPaymentMethod(method_id) {
      const paymentMethod = paymentMethods.value.find(
        (method) => method.stripe_method_id === method_id
      )

      if (paymentMethod) {
        currentMethodId.value = paymentMethod.id
        emit("hasMethod", paymentMethod)
      }

      subscriptionStore
        .updateSubscriptionPaymentMethod({
          subscription_id: props.subscription.id,
          payment_method_id: paymentMethod.id,
          payment_method_stripe_id: method_id,
        })
        .then((res) => {
          if (res && (res.data.success || parseInt(res.data.success) === 1)) {
            showSuccessNotification.value = true
            setTimeout(() => {
              showSuccessNotification.value = false
            }, 3000)
          } else {
            showFailNotification.value = true
            setTimeout(() => {
              showFailNotification.value = false
            }, 3000)
          }
        })
        .catch((err) => {
          showGenericFailNotification.value = true
          setTimeout(() => {
            showGenericFailNotification.value = false
          }, 3000)
        })
    }

    return {
      accountRole,
      paymentMethods,
      loading,
      defaultPaymentMethod,
      selectedMethodText,
      sortedPaymentMethods,
      currentMethodId,
      uniqueId,
      showSuccessNotification,
      showFailNotification,
      showGenericFailNotification,
      //methods
      updateDefaultPaymentMethod,
      updateSubscriptionPaymentMethod,
      //components
      SlideInNotification,
    }
  },
}
</script>
<style scoped>
label {
  display: block;
}
select {
  width: 95% !important;
  font-size: 16px;
}
select option {
  padding: 0.5rem 0;
  font-size: 16px;
}
select option:disabled {
  color: #ccc;
}
.payment-methods-wrapper {
  display: flex;
  /* justify-content: flex-start; */
  align-items: center;
}
.payment-methods-wrapper > span {
  margin-left: 10px;
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
</style>
