<template>
  <div v-if="scheduledChange" class="scheduled-change-alert" :class="scheduledChange.type">
    <div class="alert-content">
      <div class="alert-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="alert-text">
        <h4 v-if="scheduledChange.type === 'cancellation'">Subscription Ending</h4>
        <h4 v-else>Plan Downgrade Scheduled</h4>
        <p v-if="scheduledChange.type === 'cancellation'">
          Your subscription will be cancelled on <strong>{{ formattedDate }}</strong>.
          You'll continue to have full access until then, then your account will move to the free tier.
        </p>
        <p v-else>
          Your plan will change to <strong>{{ scheduledChange.new_plan }}</strong> on <strong>{{ formattedDate }}</strong>.
          You'll continue to have your current features until then.
        </p>
        <span class="days-remaining" v-if="scheduledChange.days_remaining !== null">
          {{ scheduledChange.days_remaining }} {{ scheduledChange.days_remaining === 1 ? 'day' : 'days' }} remaining
        </span>
      </div>
      <button
        class="btn btn-outline undo-btn"
        @click="handleUndo"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="btn-loading"></span>
        <span v-else>Keep Subscription</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSubscriptionStore } from '../stores/subscription'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  scheduledChange: {
    type: Object,
    default: null
  },
  licenseId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['change-cancelled'])

const subscriptionStore = useSubscriptionStore()
const authStore = useAuthStore()
const isLoading = ref(false)

const formattedDate = computed(() => {
  if (!props.scheduledChange?.effective_date) return ''
  const date = new Date(props.scheduledChange.effective_date)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

async function handleUndo() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    await subscriptionStore.cancelScheduledChange(
      { license_id: props.licenseId },
      authStore
    )
    emit('change-cancelled')
  } catch (error) {
    console.error('Failed to cancel scheduled change:', error)
    alert(error.response?.data?.message || 'Failed to cancel scheduled change. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.scheduled-change-alert {
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid;
}

.scheduled-change-alert.cancellation {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
}

.scheduled-change-alert.downgrade {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.alert-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancellation .alert-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.downgrade .alert-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}

.alert-icon svg {
  width: 20px;
  height: 20px;
}

.alert-text {
  flex: 1;
}

.alert-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.alert-text p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.alert-text strong {
  color: var(--text-primary);
}

.days-remaining {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
}

.cancellation .days-remaining {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
}

.downgrade .days-remaining {
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
}

.undo-btn {
  white-space: nowrap;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
}

.undo-btn:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
}

.undo-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .alert-content {
    flex-direction: column;
  }

  .undo-btn {
    width: 100%;
  }
}
</style>
