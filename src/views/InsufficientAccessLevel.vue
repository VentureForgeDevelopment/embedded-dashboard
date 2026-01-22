<template>
  <div class="access-denied-container">
    <div class="access-denied-box">
      <LockIcon :size="48" class="access-denied-icon" />
      <h1 class="access-denied-title">Permission Required</h1>
      <p class="access-denied-message">
        This page requires a higher access level than your current role.
      </p>
      <div class="role-indicator">
        Your Role: <strong>{{ authStore.currentAccountRole }}</strong>
      </div>
      <button @click="goBack" class="btn btn-primary">
        Go to Dashboard
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LockIcon from 'vue-material-design-icons/Lock.vue'

const router = useRouter()
const authStore = useAuthStore()

const goBack = () => {
  router.push({ name: 'overview' })
}
</script>

<style scoped>
.access-denied-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  background-color: var(--bg-primary);
}
.access-denied-box {
  padding: 40px;
  max-width: 450px;
  border-radius: 8px;
  background-color: var(--bg-secondary);
  box-shadow: var(--shadow);
}
.access-denied-icon {
  color: var(--accent-color);
  margin-bottom: 1rem;
}
.access-denied-title {
  color: var(--text-primary);
  font-size: 1.75rem;
  margin-bottom: 16px;
}
.access-denied-message {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 24px;
}
.role-indicator {
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}
.role-indicator strong {
  color: var(--text-primary);
}
</style>