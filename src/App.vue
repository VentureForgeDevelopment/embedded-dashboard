<script setup>
// Import and initialize theme store to apply theme on app start
import { useThemeStore } from "./stores/theme"
import { useAuthStore } from "./stores/auth"
import { useAccountStore } from "./stores/account"
import { useSubscriptionStore } from "./stores/subscription"
import { watchEffect, computed, watch } from "vue"
import { useRoute } from "vue-router"
import { getCookie, deleteCookie } from "./utils/api"

// Initialize theme
const themeStore = useThemeStore()
themeStore.applyTheme()

const authStore = useAuthStore()
const accountStore = useAccountStore()
const subscriptionStore = useSubscriptionStore()
const route = useRoute()

const accountId = computed(() => authStore.currentAccountId)
const accountRole = computed(() => authStore.currentAccountRole)

const referrals = computed(() => {
  return authStore.referrals
})

watchEffect(() => {
  //set from the registration form
  const referredByCookie = getCookie("wl_referred_by")

  if (route.query.ref) {
    // A "ref" (referral) query parameter was found in the URL
    console.log("Referral code found:", route.query.ref)
    authStore.logReferral({
      referrer_id: route.query.ref,
    })
  } else if (referredByCookie && accountId.value) {
    // A referral cookie was found, and we have an account to associate it with
    console.log("Referral cookie found:", referredByCookie)
    authStore
      .logReferral({
        referrer_id: referredByCookie,
      })
      .then(() => {
        deleteCookie("wl_referred_by")
      })
      .catch((error) => {
        console.error("Error logging referral:", error)
      })
  }
})

watch(
  () => referrals.value,
  (newVal) => {
    const hasReferrals = (referrals.value?.length || 0) > 0
    if (
      hasReferrals ||
      authStore.user?.flags?.includes("agency_signup") ||
      authStore.user?.flags?.includes("affiliate_signup") ||
      authStore.user?.flags?.includes("webinar_signup")
    ) {
      accountStore.createAgencyNotifications({
        account_id: authStore.user?.default_account_id,
      })
    }
  }
)

watch(
  () => accountId.value,
  (newVal) => {
    accountStore
      .getNotifications({
        account_id: accountId.value,
      })
      .then((res) => {
        if (
          res &&
          res.data.notifications &&
          res.data.notifications.length > 0 &&
          !authStore.initialOnboardComplete
        ) {
          let firstInitialOnboardStep = res.data.notifications.find(
            (notification) => notification.type === "initial_onboard_step"
          )
          if (
            firstInitialOnboardStep &&
            (firstInitialOnboardStep.viewed === 0 ||
              !firstInitialOnboardStep.viewed)
          ) {
            accountStore
              .markNotificationAsViewed({
                account_id: accountId.value,
                notification_id: firstInitialOnboardStep.id,
              })
              .then(() => {
                accountStore.getNotifications({
                  account_id: accountId.value,
                })
              })
          }
        }
      })
    //get subscriptions from base vffoundation pkg
    subscriptionStore.getSubscriptions({
      account_id: accountId.value,
    })

    accountStore.getPaymentMethods({
      account_id: accountId.value,
    })
  }
)
</script>

<template>
  <div class="app-wrapper">
    <router-view />
  </div>
</template>

<style>
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  font-family: "Roboto", sans-serif;
  line-height: 1.6;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

#app,
.app-wrapper {
  min-height: 100vh;
  width: 100%;
  max-width: none;
  padding: 0;
  margin: 0;
}

/* CSS Variables for theming - duplicated here for global access */
:root {
  --bg-header-footer: rgba(52, 52, 52, 1);
  --bg-header-footer-secondary: rgba(103, 103, 103, 0.8);
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-hover: #f0f0f0;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #f0f0f0;
  --border-color: #e0e0e0;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.15);
  --accent-color: #f205cb;
  --highlight-color: #7c05f2;
  --light-accent-color: #e8e8e8;
  --success-green: #229e70;
  --caution-red: #e04343;
  --warning-color: #f59e0b;
  --heading-font-family: "Work Sans", sans-serif;
}

.dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-hover: #3a3a3a;
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
  --highlight-color: #7c05f2;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Focus styles */
*:focus {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

button:focus,
input:focus,
select:focus,
textarea:focus {
  outline-offset: 0;
}
</style>
