<template>
  <div class="notifications-wrapper">
    <div class="loading-overlay" v-if="loading">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    </div>
    <div v-if="!viewingSingleNotification" class="notifications-wrapper">
      <h5 v-if="show_header" class="notifications-header">Notifications</h5>
      <ul v-if="notifications.length > 0">
        <li
          v-for="notification in notifications"
          @click="viewNotification(callParseNotification(notification))"
          :key="notification.id"
          :class="{ viewed: notification.viewed }"
        >
          <span class="message-icon">
            <span
              v-if="checkIfPriority(callParseNotification(notification))"
              class="priority-icon"
            >
              <AlertCircleOutline />
            </span>
            <Email />
          </span>
          <span class="notification-title">
            {{ callParseNotification(notification, "title") }}
          </span>
          <span class="notification-body-preview">
            {{ callParseNotification(notification, "body") }}
          </span>
          <span class="notification-date">
            {{ formatDate(notification.created_at) }}
          </span>
        </li>
      </ul>
      <div v-else>
        <p>No notifications found.</p>
      </div>
    </div>
    <div v-else class="notification-single-wrapper">
      <ViewNotification
        :notification="singleNotification"
        @back="viewingSingleNotification = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue"
import { useAccountStore } from "../../stores/account"
import moment from "moment"
import ViewNotification from "./ViewNotification.vue"
import { parseNotification } from "../../../parseNotification"
import AlertCircleOutline from "vue-material-design-icons/AlertCircleOutline.vue"
import Email from "vue-material-design-icons/Email.vue"

export default {
  name: "Notifications",
  props: {
    show_header: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    ViewNotification,
    AlertCircleOutline,
    Email,
  },
  setup() {
    const accountStore = useAccountStore()

    // State
    const viewingSingleNotification = ref(false)
    const singleNotification = ref(null)

    // Computed
    const loading = computed(() => accountStore.state.loading.notifications)
    const notifications = computed(() => {
      // Create a reversed shallow copy to avoid mutating store state directly
      return [...accountStore.state.notifications].reverse()
    })

    // Methods
    const callParseNotification = (notification, type = null) => {
      return parseNotification(notification, type)
    }

    const checkIfPriority = (notification) => {
      return parseInt(notification.priority) === 1
    }

    const formatDate = (date) => {
      return moment(date).format("MMM D, YYYY")
    }

    const viewNotification = (notification) => {
      viewingSingleNotification.value = true
      singleNotification.value = notification
    }

    return {
      viewingSingleNotification,
      singleNotification,
      loading,
      notifications,
      callParseNotification,
      checkIfPriority,
      formatDate,
      viewNotification,
      //components
      ViewNotification,
      AlertCircleOutline,
      Email,
    }
  },
}
</script>
<style scoped>
.notifications-wrapper {
  min-height: 35vh;
  overflow-y: auto;
}
.notifications-wrapper .notifications-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 2rem;
}
.notifications-wrapper ul {
  list-style: none;
  padding: 0;
}
.notifications-wrapper ul li {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color-light);
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}
.notifications-wrapper ul li:hover {
  background-color: var(--bg-secondary);
}
.notifications-wrapper ul li.viewed {
  opacity: 0.7;
}
.notifications-wrapper ul li.viewed .notification-title {
  font-weight: 500;
}
.notifications-wrapper ul li:not(.viewed) .notification-title {
  font-weight: 600;
}
.message-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
.priority-icon {
  background: var(--danger-color, red);
  position: absolute;
  top: -5px;
  right: -5px;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--bg-primary);
}
.notification-title {
  grid-column: 2;
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notification-body-preview {
  grid-column: 2;
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notification-date {
  grid-column: 3;
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
