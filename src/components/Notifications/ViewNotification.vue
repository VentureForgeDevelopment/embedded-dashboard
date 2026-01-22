<template>
  <div class="view-notification-wrapper">
    <div>
      <button @click="$emit('back')" tabindex="0" class="btn btn-link">
        <ArrowLeft
          style="
            display: inline-flex;
            justify-content: center;
            align-items: center;
          "
        />
        Back
      </button>
    </div>
    <div class="notification-content">
      <h4 class="notification-title">
        {{ notification.title }}
      </h4>

      <div class="notification-body">
        <p>
          {{ notification.body }}
        </p>

        <p v-if="notification.type === 'invoice.payment_failed'" class="extra">
          Or you can also manually update your payment information and attempt a
          retry payment from the invoices tab.
          <br />
          <button
            class="view-invoices-button btn btn-outline"
            type="default"
            @click="redirectToSubscriptions()"
          >
            View Failed Payment
          </button>
        </p>

        <p v-if="notification.type === 'initial_onboard'" class="extra">
          <br />
          <button
            class="view-invoices-button btn btn-outline"
            type="default"
            @click="redirectToAccountSetup()"
          >
            Finalize Account Setup
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAccountStore } from "../../stores/account"
import { useAuthStore } from "../../stores/auth"
import { useThemeStore } from "../../stores/theme"
import ArrowLeft from 'vue-material-design-icons/ArrowLeft.vue'

export default {
  name: "ViewNotification",
  props: {
    notification: {
      type: Object,
      required: true,
    },
  },
  components: {
    ArrowLeft,
  },
  setup(props) {
    const router = useRouter()
    const accountStore = useAccountStore()
    const authStore = useAuthStore()
    const themeStore = useThemeStore()

    const redirectToAccountSetup = () => {
      router.push({ path: "/account-setup" })
      themeStore.closeModal()
    }

    const redirectToSubscriptions = () => {
      router.push({ path: "/subscriptions" })
      themeStore.closeModal()
    }

    onMounted(() => {
      if (
        (props.notification && !props.notification.viewed) ||
        parseInt(props.notification.viewed) === 0
      ) {
        accountStore
          .markNotificationAsViewed({
            notification_id: props.notification.id,
          })
          .then(() => {
            accountStore.getNotifications({
              account_id: authStore.currentAccountId,
            })
          })
      }
    })

    return {
      redirectToAccountSetup,
      redirectToSubscriptions,
      //components
      ArrowLeft,
    }
  },
}
</script>
<style scoped>
.view-notification-wrapper {
  padding: 0.5rem;
}

.view-notification-wrapper :deep(.btn) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.notification-content {
  padding: 1.5rem;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color-light);
}
.notification-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}
.notification-body p {
  color: var(--text-secondary);
  line-height: 1.6;
}
.notification-body .extra {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color-light);
}
.view-invoices-button {
  margin-top: 1rem;
}
</style>
