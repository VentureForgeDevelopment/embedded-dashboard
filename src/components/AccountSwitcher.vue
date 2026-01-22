<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Component state
const accounts = ref([])
const loading = ref(false)
const error = ref('')

// Computed properties
const currentAccount = computed(() => {
  // Use session-based current account ID if available, otherwise fall back to is_current flag
  if (authStore.currentAccountId) {
    return accounts.value.find(acc => acc.id === authStore.currentAccountId) || null
  }
  return accounts.value.find(acc => acc.is_current) || null
})

const availableAccounts = computed(() => {
  // Use session-based current account ID if available, otherwise fall back to is_current flag
  if (authStore.currentAccountId) {
    return accounts.value.filter(acc => acc.id !== authStore.currentAccountId)
  }
  return accounts.value.filter(acc => !acc.is_current)
})

const hasMultipleAccounts = computed(() => {
  return accounts.value.length > 1
})

// Methods
const loadAccounts = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const result = await authStore.getUserAccounts()
    if (result.success) {
      accounts.value = result.accounts
    } else {
      error.value = result.error || 'Failed to load accounts'
    }
  } catch (err) {
    error.value = 'Failed to load accounts'
    console.error('Error loading accounts:', err)
  } finally {
    loading.value = false
  }
}

const switchAccount = async (accountId) => {
  if (loading.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const result = await authStore.switchAccount(accountId)
    if (result.success) {
      // Reload accounts to update current status - this will automatically update the UI
      await loadAccounts()
      // No page reload needed - reactive components will update automatically
    } else {
      error.value = result.error || 'Failed to switch account'
    }
  } catch (err) {
    error.value = 'Failed to switch account'
    console.error('Error switching account:', err)
  } finally {
    loading.value = false
  }
}

const onAccountChange = (event) => {
  const selectedAccountId = parseInt(event.target.value)
  if (selectedAccountId !== currentAccount.value?.id) {
    switchAccount(selectedAccountId)
  }
}

// Load accounts on mount
onMounted(() => {
  loadAccounts()
})
</script>

<template>
  <div class="account-switcher">
    <!-- Current Account Display (always show when accounts are loaded) -->
    <div v-if="!loading && currentAccount" class="current-account-display">
      <div class="dropdown-section-title">Current Account</div>
      <div class="current-account-info">
        <div class="account-name">{{ currentAccount.name }}</div>
        <div class="account-details">
          <span class="account-role">Access Level: {{ currentAccount.access_level }}</span>
        </div>
      </div>
    </div>

    <!-- Only show switcher if user has multiple accounts -->
    <div v-if="!loading && hasMultipleAccounts" class="dropdown-section">
      <div class="dropdown-section-title">Switch Account</div>
      
      <!-- Account Select Dropdown -->
      <div class="account-selector">
        <select 
          :value="currentAccount?.id" 
          @change="onAccountChange($event)"
          :disabled="loading"
          class="account-select"
        >
          <option 
            v-for="account in accounts" 
            :key="account.id"
            :value="account.id"
          >
            {{ account.name }} ({{ account.access_level }}){{ account.is_current ? ' - Current' : '' }}
          </option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <span class="loading-spinner">⏳</span>
        Switching account...
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>
    </div>

    <!-- Single Account Info (when user only has one account) -->
    <div v-else-if="!loading && accounts.length === 1 && currentAccount" class="single-account">
      <div class="dropdown-section-title">Account</div>
      <div class="account-item">
        <div class="account-info">
          <div class="account-name">{{ currentAccount.name }}</div>
          <div class="account-role">{{ currentAccount.access_level }}</div>
        </div>
        <div class="account-status">
          <span v-if="currentAccount.is_current" class="current-badge">Current</span>
        </div>
      </div>
    </div>

    <!-- Loading state for initial load -->
    <div v-if="loading && accounts.length === 0" class="loading-initial">
      <div class="dropdown-section-title">Account</div>
      <div class="loading-state">
        <span class="loading-spinner">⏳</span>
        Loading accounts...
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-switcher {
  width: 100%;
}

.dropdown-section {
  padding: 0.5rem 0;
}

.dropdown-section-title {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  margin: 0.125rem 0;
  border-radius: 8px;
  transition: background 0.2s ease;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.account-item.clickable {
  cursor: pointer;
}

.account-item.clickable:hover:not(:disabled) {
  background: var(--bg-hover);
}

.account-item.clickable:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.account-item.current {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-weight: 600;
  color: var(--text-tertiary);
  font-size:0.9rem;
  margin-bottom:0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-role {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
}

.account-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  flex-shrink: 0;
}

.current-indicator {
  font-size: 0.75rem;
  color: var(--accent-color);
  font-weight: 600;
}

.current-badge {
  font-size: 0.7rem;
  background: rgba(102, 126, 234, 0.15);
  color: var(--accent-color);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 500;
}

.single-account .account-item {
  cursor: default;
}

.single-account .account-item:hover {
  background: none;
}

/* Account Select Dropdown Styles */
.account-selector {
  padding: 0.5rem 0.75rem;
}

.account-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.account-select:hover:not(:disabled) {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.account-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.account-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--bg-hover);
}

.account-select option {
  padding: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* Current Account Display Styles */
.current-account-display {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
}

.current-account-info {
  padding: 0.5rem 0.75rem;
  background: var(--bg-header-footer-secondary);
  border-radius: 6px;
  margin: 0.25rem 0;
}

.account-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.account-details .primary-badge {
  background: var(--accent-color);
  color: white;
  font-size: 0.7rem;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  font-weight: 500;
}
</style>