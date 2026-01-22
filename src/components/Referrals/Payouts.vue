<template>
  <div>
    <SlideInNotification
      :show="notification.show"
      :message="notification.message"
      :type="notification.type"
    />
    <div class="payouts-wrapper">
      <div class="commission-balance-card">
        <h2>Current Balance</h2>
        <p class="subtitle-details">
          Track your earnings and payout eligibility
        </p>
        <div class="balance-amount">
          <div>
            <p>Available Balance</p>
            <span class="payout-balance"
              >${{ parseFloat(availableCommission).toFixed(2) }}</span
            >
          </div>
          <div>
            <div class="payout-balance-icon">
              <WalletOutline
                size="34"
                fill-color="var(--success-green)"
                style="
                  display: inline-flex;
                  justify-content: center;
                  align-items: center;
                "
              />
            </div>
          </div>
        </div>

        <div class="progress-wrapper">
          <p class="progress-details">
            <span>{{ parseFloat(progressPercentage).toFixed(1) }}%</span>
          </p>
          <div class="progress-container">
            <div
              class="progress-bar"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
          <p v-if="!canRequestPayout && !isEligibleButNoEmail" class="progress-text">
            You're ${{ 100 - parseFloat(availableCommission).toFixed(2) }} away
            from your minimum payout.
          </p>
          <p v-else class="progress-text">
            You've reached the minimum payout amount!
          </p>
          <button
            @click="requestPayout"
            :disabled="!canRequestPayout"
            :class="[
              'btn',
              'btn-primary',
              'payout-btn',
              { 'btn-disabled': !canRequestPayout },
            ]"
          >
            Request Payout
          </button>
          <p v-if="isEligibleButNoEmail" class="payout-warning">
            Please add your PayPal email below to request a payout.
          </p>
          <span class="payout-btn-details subtitle-details">
            Payouts are processed within 5-7 business days.
          </span>
        </div>
      </div>

      <div class="payout-history-card">
        <h2>Payout History</h2>
        <span class="subtitle-details">
          <p>
            Total Paid Out
            <span class="payout-balance"
              >${{ parseFloat(totalPaidOut).toFixed(2) }}</span
            >
          </p>
        </span>
        <div v-if="payouts && payouts.length > 0" class="payout-history-list">
          <div
            v-for="payout in payouts"
            :key="payout.id"
            class="payout-history-item"
          >
            <div class="payout-item-details">
              <span class="payout-item-date">{{
                new Date(payout.created_at).toLocaleDateString()
              }}</span>
              <span class="payout-item-amount"
                >${{ parseFloat(payout.amount).toFixed(2) }}</span
              >
            </div>
            <span :class="['status', payout.status]">{{ payout.status }}</span>
          </div>
        </div>
        <div v-else class="no-payouts-message">
          No payouts yet.
          <router-link to="/referrals">Start earning</router-link> by inviting
          friends.
        </div>
      </div>
    </div>
    <div class="paypal-email-card">
      <h2>PayPal Email</h2>
      <p class="subtitle-details">
        Your earnings will be sent to your PayPal account. Please ensure your
        PayPal email is correct.
      </p>
      <div class="paypal-input-wrapper">
        <input
          type="email"
          v-model="paypalEmail"
          @blur="v$.paypalEmail.$touch()"
          :class="{ 'is-invalid': v$.paypalEmail.$error }"
          placeholder="Enter your PayPal email"
        />
        <div v-if="v$.paypalEmail.$error" class="validation-error-message">
          {{ v$.paypalEmail.$errors[0]?.$message }}
        </div>
      </div>
      <button
        @click="handleUpdatePaypalEmail"
        class="btn btn-primary"
        :disabled="isLoading || v$.paypalEmail.$invalid"
        :class="['btn', 'btn-primary', { 'btn-disabled': v$.paypalEmail.$invalid }]"
      >
        {{ isLoading ? "Saving..." : "Save PayPal Email" }}
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from "vue"
import { useAuthStore } from "../../stores/auth"
import WalletOutline from "vue-material-design-icons/WalletOutline.vue"
import SlideInNotification from "../SlideInNotification.vue"
import Swal from "sweetalert2"
import useVuelidate from "@vuelidate/core"
import { required, email } from "@vuelidate/validators"

export default {
  name: "Payouts",
  components: {
    WalletOutline,
    SlideInNotification,
  },
  setup() {
    const authStore = useAuthStore()
    const paypalEmail = ref(authStore.user?.paypal_email || "")
    const isLoading = ref(false)
    const notification = ref({
      show: false,
      message: "",
      type: "success",
    })

    const rules = computed(() => ({
      paypalEmail: { required, email },
    }))

    const v$ = useVuelidate(rules, { paypalEmail })

    const payouts = computed(() => {
      return authStore.payouts
    })
    const user = computed(() => authStore.user)

    const availableCommission = computed(() => {
      return authStore.availableCommission
    })

    const totalPaidOut = computed(() => {
      if (!payouts.value || payouts.value.length === 0) {
        return 0
      }
      return payouts.value
        .filter((p) => p.status === "paid")
        .reduce((total, payout) => total + parseFloat(payout.amount), 0)
    })

    const minimumPayout = 100

    const canRequestPayout = computed(() => {
      return (
        availableCommission.value >= minimumPayout && !!paypalEmail.value?.trim()
      )
    })

    const progressPercentage = computed(() => {
      const percentage = (availableCommission.value / minimumPayout) * 100
      return Math.min(percentage, 100) // Cap at 100%
    })

    const isEligibleButNoEmail = computed(() => {
      return (
        availableCommission.value >= minimumPayout &&
        (!paypalEmail.value || !paypalEmail.value.trim())
      )
    })

    const showNotification = (message, type = "success") => {
      notification.value.message = message
      notification.value.type = type
      notification.value.show = true
      setTimeout(() => {
        notification.value.show = false
      }, 3000)
    }

    const handleUpdatePaypalEmail = async () => {
      v$.value.paypalEmail.$touch()
      if (v$.value.paypalEmail.$invalid) return

      isLoading.value = true
      try {
        const response = await authStore.updatePaypalEmail({
          email: paypalEmail.value,
        })
        if (response.success) {
          // Manually update the user object in the store as the backend doesn't return it
          if (authStore.user) {
            authStore.user.paypal_email = paypalEmail.value
          }
          showNotification("PayPal email updated successfully!", "success")
        } else {
          throw new Error(response.error || "Failed to update PayPal email.")
        }
      } catch (error) {
        console.error("Failed to update PayPal email:", error)
        const errorMessage = error.message || "An unexpected error occurred."
        showNotification(errorMessage, "error")
      } finally {
        isLoading.value = false
      }
    }

    const requestPayout = async () => {
      if (canRequestPayout.value) {
        try {
          const response = await authStore.createPayout()
          if (response.success) {
            // Refresh data after successful payout
            await authStore.getPayouts()
            Swal.fire({
              title: "Payout Requested!",
              text: "Your payout request has been submitted and will be processed within 5-7 business days.",
              icon: "success",
              confirmButtonText: "Great!",
            })
          } else {
            throw new Error(response.error || "Failed to create payout.")
          }
        } catch (error) {
          console.error("Failed to create payout:", error)
          Swal.fire({
            title: "Error!",
            text: "There was an issue submitting your payout request. Please try again later.",
            icon: "error",
            confirmButtonText: "Ok",
          })
        }
      }
    }

    onMounted(() => {
      authStore.getPayouts()
    })

    return {
      payouts,
      availableCommission,
      canRequestPayout,
      progressPercentage,
      requestPayout,
      totalPaidOut,
      paypalEmail,
      isLoading,
      handleUpdatePaypalEmail,
      notification,
      isEligibleButNoEmail,
      v$,
      //components
      WalletOutline,
    }
  },
}
</script>

<style scoped>
.paypal-input-wrapper {
  margin-bottom: 1rem;
}

.paypal-email-card {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  text-align: left;
}

.paypal-email-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.paypal-email-card input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.validation-error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  text-align: left;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #e74c3c !important;
}

.paypal-email-card .btn {
  width: auto;
  padding: 0.5rem 1.5rem;
}

.payouts-wrapper {
  text-align: left;
  display: flex;
}

.commission-balance-card {
  padding: 24px;
  text-align: center;
  flex: 1;
  min-width: 300px;
  text-align: left;
  margin-bottom: 1rem;
}

.commission-balance-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.subtitle-details {
  font-size: 14px;
  color: var(--text-secondary);
}

.balance-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f0f4ff;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.balance-amount .payout-balance {
  font-size: 1.5em;
  font-weight: 600;
}
.progress-wrapper {
  margin: 1rem 0;
}

.progress-container {
  border-radius: 9999px;
  width: 100%;
  overflow: hidden;
  height: 12px;
  background: #ddd;
}

.payout-balance-icon {
  padding: 0.5rem;
  background-color: #f9fafb;
  border: 1px solid var(--success-green);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
}

.progress-bar {
  background-color: var(--success-green);
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease-in-out;
}

.progress-details {
  text-align: right;
}

.progress-text {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.payout-btn {
  margin-top: 1rem;
}

.payout-warning {
  color: var(--warning-color); 
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.payout-btn-details {
  font-size: 12px;
  display: block;
}

.payout-history-card {
  padding: 24px;
  flex: 1.5;
  min-width: 300px;
}

.payout-history-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.payout-history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payout-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border-bottom: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.payout-item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.payout-item-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.payout-item-amount {
  font-weight: 600;
}

.no-payouts-message {
  text-align: center;
  color: #6b7280;
  padding: 40px 0;
}

.status {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status.pending {
  background-color: #fef3c7;
  color: var(--warning-color);
}

.status.paid {
  background-color: #d1fae5;
  color: var(--success-green);
}
@media (max-width: 768px) {
  .payouts-wrapper {
    display: block;
  }
}
</style>
