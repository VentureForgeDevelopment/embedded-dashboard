<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../utils/api.js'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const accountData = ref({ name: '' })
const loading = ref(false)
const error = ref('')
const success = ref('')

// Load current account data
const loadAccount = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('account')
    if (response.data.success) {
      accountData.value.name = response.data.account.name
    } else {
      error.value = 'Failed to load account information'
    }
  } catch (err) {
    error.value = 'Failed to load account information'
    console.error('Error loading account:', err)
  } finally {
    loading.value = false
  }
}

// Update account
const updateAccount = async () => {
  if (!accountData.value.name.trim()) {
    error.value = 'Account name is required'
    return
  }
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await api.put('account', {
      name: accountData.value.name.trim(),
      account_id: authStore.currentAccountId
    })
    
    if (response.data.success) {
      success.value = 'Account updated successfully'
    } else {
      error.value = response.data.error || 'Failed to update account'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to update account'
    console.error('Error updating account:', err)
  } finally {
    loading.value = false
  }
}

// Watch for account changes and reload data
watch(() => authStore.currentAccountId, (newAccountId, oldAccountId) => {
  if (newAccountId !== oldAccountId && newAccountId) {
    loadAccount()
  }
}, { immediate: false })

// Load account data when component mounts
onMounted(() => {
  loadAccount()
})
</script>

<template>
  <div class="edit-account-container max-1200 padding">
    <div class="page-header">
      <h2 class="page-title">Edit Account</h2>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !accountData.name" class="loading-message">
      Loading account information...
    </div>

    <!-- Main Content -->
    <div v-else class="account-form-container">
      <!-- Success Message -->
      <div v-if="success" class="success-message">
        {{ success }}
        <button @click="success = ''" class="close-message">&times;</button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button @click="error = ''" class="close-message">&times;</button>
      </div>

      <!-- Account Form -->
      <div class="form-card">
        <div class="form-header">
          <h3>Account Information</h3>
          <p class="form-description">Update your account name and settings.</p>
        </div>
        
        <form @submit.prevent="updateAccount" class="account-form">
          <div class="form-group">
            <label for="accountName">Account Name</label>
            <input 
              id="accountName"
              v-model="accountData.name" 
              type="text" 
              class="form-input" 
              required 
              :disabled="loading"
            />
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="loading || !accountData.name.trim()"
            >
              {{ loading ? 'Updating...' : 'Update Account' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-account-container {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.loading-message {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.account-form-container {
  max-width: 600px;
}

.success-message,
.error-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.close-message {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.form-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

.form-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-header h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.form-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.account-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>