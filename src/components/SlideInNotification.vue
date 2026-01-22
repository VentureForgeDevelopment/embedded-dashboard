<template>
  <transition name="notification">
    <div v-if="show" :class="['notification', typeClass]" aria-live="polite">
      <div v-html="icon" class="notification-icon"></div>
      <span>{{ message }}</span>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "success", // success, error, warning, info
  },
})

const typeClass = computed(() => `notification-${props.type}`)

const icon = computed(() => {
  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`,
  }
  return icons[props.type] || icons.success
})
</script>

<style>
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--success-green);
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 1000;
  font-size: 0.875rem;
  font-weight: 500;
}

.notification-success {
  background: var(--success-green);
}

.notification-error {
  background: #ef4444; /* red-500 */
}

.notification-icon :deep(svg) {
  display: block;
  flex-shrink: 0;
}

/* Notification animation */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.5s ease;
}

.notification-enter-from {
  right: -100%;
  opacity: 0;
}

.notification-leave-to {
  right: -100%;
  opacity: 0;
}
</style>
